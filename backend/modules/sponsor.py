from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import os
import crypt

sponsor = Blueprint("sponsor", __name__)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None), #password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}

@sponsor.route('/sponsor/get-sponsor-details/<username>', methods=['GET'])
def get_sponsor_details(username):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # Query to get the sponsor user's phone number, email, and address
    contact_query = """
        SELECT UserPhone, UserEmail, UserAddress, UserCity, UserState, UserZipCode, UserSecAddress, UserBio 
        FROM Users 
        WHERE Username = %s;
    """
    cursor.execute(contact_query, (username,))
    contact_result = cursor.fetchone()

    # Query to get the sponsor's company name
    sponsor_query = """
        SELECT s.SponsorCompanyName, s.SponsorID 
        FROM Users u
        JOIN SponsorUser su ON u.UserID = su.UserID
        JOIN Sponsor s ON su.SponsorID = s.SponsorID
        WHERE u.Username = %s;
    """
    cursor.execute(sponsor_query, (username,))
    sponsor_result = cursor.fetchone()

    conn.close()

    if contact_result and sponsor_result:
        decrypted_phone = crypt.decrypt(contact_result['UserPhone'])

        address_parts = []
        address_parts.append(f"{crypt.decrypt(contact_result['UserAddress'])}, ")
        if contact_result['UserSecAddress']:
            address_parts.append(f"{crypt.decrypt(contact_result['UserSecAddress'])}, ")
        address_parts.append(f"{crypt.decrypt(contact_result['UserCity'])}, {crypt.decrypt(contact_result['UserState'])} {crypt.decrypt(contact_result['UserZipCode'])}")

        decrypted_address = "\n".join(filter(None, address_parts)) if address_parts else None
        bio = contact_result['UserBio']

        return jsonify({
            'success': True,
            'sponsorCompanyName': sponsor_result['SponsorCompanyName'],
            'sponsorID': sponsor_result['SponsorID'],
            'phoneNumber': decrypted_phone,
            'email': contact_result['UserEmail'],
            'shippingAddress': decrypted_address,
            'bio': bio
        })
    else:
        return jsonify({'success': False, 'message': 'Sponsor user not found'}), 404

@sponsor.route('/sponsor/create', methods=['POST'])
def create_user():
    data = request.get_json()
    user_id = data.get('user_id')  # This is the logged-in sponsor user's ID from localStorage

    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    # Extract new user details
    username = data.get('username')
    password = data.get('password')
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    phone = data.get('phoneNumber')
    email = data.get('email')
    primary_address = data.get('address1')
    secondary_address = data.get('address2')
    city = data.get('city')
    state = data.get('state')
    zipcode = data.get('zipCode')
    role = data.get('role')  # 'driver' or 'sponsor'

    if not all([username, password, firstname, lastname, phone, primary_address, city, state, zipcode, role]):
        return jsonify({"success": False, "message": "Missing Argument"}), 400
    
    phone = crypt.encrypt(phone)
    primary_address = crypt.encrypt(primary_address)
    if secondary_address:
        secondary_address = crypt.encrypt(secondary_address)
    city = crypt.encrypt(city)
    state = crypt.encrypt(state)
    zipcode = crypt.encrypt(zipcode)

    hashed_password = generate_password_hash(password)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    try:

        # Get SponsorID from SponsorUser table using the logged-in sponsor user's ID
        sponsor_query = "SELECT * FROM Sponsor JOIN SponsorUser USING (SponsorID) WHERE UserID = %s"
        cursor.execute(sponsor_query, (user_id,))
        sponsor_data = cursor.fetchone()

        if not sponsor_data:
            return jsonify({"success": False, "message": "Sponsor organization not found"}), 404

        sponsor_id = sponsor_data['SponsorID']

        # Check if the username already exists
        cursor.execute("SELECT Username FROM Users WHERE Username=%s;", (username,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "User already exists"}), 400

        if role == "driver":
            # Insert the new user using ADD_DRIVER stored procedure
            cursor.callproc("ADD_DRIVER", (
                firstname, lastname, username, hashed_password, phone, email, primary_address,
                city, state, zipcode, secondary_address
            ))

            # Get the newly created UserID
            cursor.execute("SELECT UserID FROM Users WHERE Username=%s;", (username,))
            user_data = cursor.fetchone()
            new_user_id = user_data['UserID']

            query = "INSERT INTO DriverRelation (UserID, SponsorID, DriverReason, DriverStatus, DriverPoints) VALUES (%s, %s, %s, %s, %s);"

            # Update SponsorID for the driver user
            cursor.execute(query, (new_user_id, sponsor_id, "Sponsor Created User", 2, 0))
        else:
            cursor.callproc("ADD_SPONSOR_USER", (
                firstname, lastname, username, hashed_password, phone, email, primary_address,
                city, state, zipcode, secondary_address, sponsor_id
            ))

        conn.commit()

        return jsonify({"success": True, "message": f"User {username} created successfully"})

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/get_sponsor_list', methods=['GET'])
def get_sponsors():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT SponsorCompanyName FROM Sponsor")
        sponsors = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'sponsors': [sponsor['SponsorCompanyName'] for sponsor in sponsors]})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@sponsor.route('/sponsor/applications', methods=['GET'])
def get_applications():
    user_id = request.args.get('user_id')
    status_filter = request.args.get('status', 'pending')  # Default to pending applications

    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"})

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get the sponsor organization ID from the SponsorUser table
        cursor.execute("SELECT SponsorID FROM SponsorUser WHERE UserID = %s", (user_id,))
        sponsor = cursor.fetchone()

        if not sponsor:
            return jsonify({"success": False, "message": "Sponsor user not found"})

        sponsor_id = sponsor["SponsorID"]

        # Define query condition based on filter
        status_condition = ""
        if status_filter == "pending":
            status_condition = "AND dr.DriverStatus = 1"
        elif status_filter == "all":
            status_condition = ""  # No filter, fetch all applications

        # Fetch applications based on the selected filter
        query = f"""
            SELECT 
                u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, 
                d.DriverExp, dr.DriverReason, dr.DriverStatus, u.UserPhone, dr.SponsorID,
                dr.SponsorReason
            FROM DriverRelation dr
            JOIN Users u ON dr.UserID = u.UserID
            JOIN DriverInfo d ON dr.UserID = d.UserID
            WHERE dr.SponsorID = %s AND u.UserIsActive = 1 {status_condition};
        """
        cursor.execute(query, (sponsor_id,))
        applications = cursor.fetchall()

        # Decrypt phone numbers
        for app in applications:
            app["UserPhone"] = crypt.decrypt(app["UserPhone"])

        return jsonify({
            "success": True, 
            "applications": applications,
            "sponsor_id": sponsor_id
        })

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@sponsor.route('/sponsor/applications/respond', methods=['POST'])
def respond_to_application():
    data = request.get_json()
    driver_id = data.get("driver_id")
    action = data.get("action")  # "accept" or "reject"
    sponsor_id = data.get("sponsor_id")
    reason = data.get("reason")  # The reason for accepting or rejecting the application

    if not driver_id or not sponsor_id or action not in ["accept", "reject"]:
        return jsonify({"success": False, "message": "Invalid request data"})

    if action == "accept":
        points = 0 
        status = 2  # Accepted status
    else:
        points = None
        status = 0  # Rejected status

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Update the application with the reason and new status
        update_query = """
            UPDATE DriverRelation 
            SET DriverStatus = %s, DriverPoints = %s, SponsorReason = %s
            WHERE UserID = %s AND SponsorID = %s
        """
        cursor.execute(update_query, (status, points, reason, driver_id, sponsor_id))
        conn.commit()

        affected_rows = cursor.rowcount
        print(f"Affected rows: {affected_rows}")

        if affected_rows == 0:
            return jsonify({"success": False, "message": "No matching application found or no changes made"})

        notification_query = """
            INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate)
            VALUES (%s, %s, %s, NOW())
        """

        notification_type = f"Application"
        notification_details = f"An update has been made to your application status!"
        cursor.execute(notification_query, (driver_id, notification_type, notification_details))
        conn.commit()

        return jsonify({
            "success": True, 
            "message": f"Application {action}ed successfully",
            "affected_rows": affected_rows
        })

    except mysql.connector.Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"success": False, "message": str(e)})

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/drivers', methods=['GET'])
def get_drivers():
    user_id = request.args.get('user_id')
    status = request.args.get('status', 2, type=int)  # Default to accepted drivers

    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get the sponsor organization ID from the SponsorUser table
        cursor.execute("SELECT SponsorID FROM SponsorUser WHERE UserID = %s", (user_id,))
        sponsor = cursor.fetchone()

        if not sponsor:
            return jsonify({"success": False, "message": "Sponsor user not found"}), 404

        sponsor_id = sponsor["SponsorID"]

        # Query to get drivers with specific status
        query = """
            SELECT 
                u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, 
                u.UserBio, u.UserPhone, u.UserAddress, u.UserSecAddress, u.UserCity, 
                u.UserState, u.UserZipCode, d.DriverTruckInfo, dr.DriverStatus,
                dr.DriverRelationID, dr.DriverPoints
            FROM DriverRelation dr
            JOIN Users u ON dr.UserID = u.UserID
            JOIN DriverInfo d ON dr.UserID = d.UserID
            WHERE dr.SponsorID = %s AND dr.DriverStatus = %s AND u.UserIsActive = 1;
        """
        cursor.execute(query, (sponsor_id, status))
        drivers = cursor.fetchall()

        # Decrypt sensitive data
        for driver in drivers:
            driver['UserPhone'] = crypt.decrypt(driver['UserPhone'])
            driver['UserAddress'] = crypt.decrypt(driver['UserAddress'])
            if driver['UserSecAddress']:
                driver['UserSecAddress'] = crypt.decrypt(driver['UserSecAddress'])
            driver['UserCity'] = crypt.decrypt(driver['UserCity'])
            driver['UserState'] = crypt.decrypt(driver['UserState'])
            driver['UserZipCode'] = crypt.decrypt(driver['UserZipCode'])

        return jsonify({
            "success": True,
            "drivers": drivers
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@sponsor.route('/sponsor/driver/<driver_id>', methods=['GET'])
def get_driver_details(driver_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, 
                u.UserBio, u.UserPhone, u.UserAddress, u.UserSecAddress,
                u.UserCity, u.UserState, u.UserZipCode, d.DriverTruckInfo
            FROM Users u
            JOIN DriverInfo d ON u.UserID = d.UserID
            WHERE u.UserID = %s
        """, (driver_id,))
        
        driver_data = cursor.fetchone()
        
        if not driver_data:
            return jsonify({"success": False, "message": "Driver not found"}), 404

        # Decrypt sensitive information
        driver_data['UserPhone'] = crypt.decrypt(driver_data['UserPhone'])
        driver_data['UserAddress'] = crypt.decrypt(driver_data['UserAddress']) if driver_data['UserAddress'] else ''
        if driver_data['UserSecAddress']:
            driver_data['UserSecAddress'] = crypt.decrypt(driver_data['UserSecAddress'])
        driver_data['UserCity'] = crypt.decrypt(driver_data['UserCity']) if driver_data['UserCity'] else ''
        driver_data['UserState'] = crypt.decrypt(driver_data['UserState']) if driver_data['UserState'] else ''
        driver_data['UserZipCode'] = crypt.decrypt(driver_data['UserZipCode']) if driver_data['UserZipCode'] else ''

        return jsonify({
            "success": True,
            "driver": driver_data
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/update-driver/<driver_id>', methods=['PUT'])
def update_driver_info(driver_id):
    data = request.get_json()
    sponsor_user_id = data.get('sponsor_user_id')
    
    if not sponsor_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Encrypt sensitive data
        phone = crypt.encrypt(data.get('UserPhone')) if data.get('UserPhone') else None
        address = crypt.encrypt(data.get('UserAddress')) if data.get('UserAddress') else None
        sec_address = crypt.encrypt(data.get('UserSecAddress')) if data.get('UserSecAddress') else None
        city = crypt.encrypt(data.get('UserCity')) if data.get('UserCity') else None
        state = crypt.encrypt(data.get('UserState')) if data.get('UserState') else None
        zipcode = crypt.encrypt(data.get('UserZipCode')) if data.get('UserZipCode') else None

        # Update Users table
        cursor.execute("""
            UPDATE Users 
            SET 
                UserFName = %s,
                UserLName = %s,
                Username = %s,
                UserEmail = %s,
                UserPhone = %s,
                UserBio = %s,
                UserAddress = %s,
                UserSecAddress = %s,
                UserCity = %s,
                UserState = %s,
                UserZipCode = %s
            WHERE UserID = %s
        """, (
            data.get('UserFName'),
            data.get('UserLName'),
            data.get('Username'),
            data.get('UserEmail'),
            phone,
            data.get('UserBio'),
            address,
            sec_address,
            city,
            state,
            zipcode,
            driver_id
        ))

        # Update DriverInfo table
        cursor.execute("""
            UPDATE DriverInfo
            SET DriverTruckInfo = %s
            WHERE UserID = %s
        """, (
            data.get('DriverTruckInfo'),
            driver_id
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Driver information updated successfully"
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/update-driver-status/<driver_id>', methods=['PUT'])
def update_driver_status(driver_id):
    data = request.get_json()
    sponsor_user_id = data.get('sponsor_user_id')
    new_status = data.get('new_status')
    
    if not sponsor_user_id or new_status is None:
        return jsonify({"success": False, "message": "Unauthorized or missing status"}), 401

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Verify sponsor has access to this driver
        cursor.execute("""
            SELECT su.SponsorID 
            FROM SponsorUser su 
            WHERE su.UserID = %s
        """, (sponsor_user_id,))
        sponsor_data = cursor.fetchone()
        
        if not sponsor_data:
            return jsonify({"success": False, "message": "Sponsor not found"}), 404

        sponsor_id = sponsor_data['SponsorID']

        # Update driver status
        cursor.execute("""
            UPDATE DriverRelation 
            SET DriverStatus = %s 
            WHERE UserID = %s AND SponsorID = %s
        """, (new_status, driver_id, sponsor_id))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Driver status updated successfully"
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/sponsor-user/<user_id>', methods=['GET'])
def get_sponsor_user(user_id):
    requesting_sponsor_id = request.args.get('user_id')

    if not requesting_sponsor_id:
        return jsonify({
            'success': False,
            'message': 'No sponsor user ID provided'
        }), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
            
        # Fetch the sponsor user's information
        user_query = """
            SELECT * FROM Users WHERE UserID = %s
        """
        cursor.execute(user_query, (user_id,))
        sponsor_user = cursor.fetchone()

        # Decrypt sensitive information
        sponsor_user['UserPhone'] = crypt.decrypt(sponsor_user['UserPhone'])
        sponsor_user['UserAddress'] = crypt.decrypt(sponsor_user['UserAddress']) if sponsor_user['UserAddress'] else ''
        if sponsor_user['UserSecAddress']:
            sponsor_user['UserSecAddress'] = crypt.decrypt(sponsor_user['UserSecAddress'])
        sponsor_user['UserCity'] = crypt.decrypt(sponsor_user['UserCity']) if sponsor_user['UserCity'] else ''
        sponsor_user['UserState'] = crypt.decrypt(sponsor_user['UserState']) if sponsor_user['UserState'] else ''
        sponsor_user['UserZipCode'] = crypt.decrypt(sponsor_user['UserZipCode']) if sponsor_user['UserZipCode'] else ''
        
        if not sponsor_user:
            return jsonify({
                'success': False,
                'message': 'Sponsor user not found'
            }), 404
            
        return jsonify({
            'success': True,
            'sponsor': sponsor_user
        })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@sponsor.route('/sponsor/update-sponsor/<int:user_id>', methods=['PUT'])
def update_sponsor_user(user_id):
    data = request.json
    sponsor_user_id = data.get('sponsor_user_id')
    
    if not sponsor_user_id:
        return jsonify({
            'success': False,
            'message': 'No sponsor user ID provided'
        }), 400
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Encrypt sensitive data
        phone = crypt.encrypt(data.get('UserPhone')) if data.get('UserPhone') else None
        address = crypt.encrypt(data.get('UserAddress')) if data.get('UserAddress') else None
        sec_address = crypt.encrypt(data.get('UserSecAddress')) if data.get('UserSecAddress') else None
        city = crypt.encrypt(data.get('UserCity')) if data.get('UserCity') else None
        state = crypt.encrypt(data.get('UserState')) if data.get('UserState') else None
        zipcode = crypt.encrypt(data.get('UserZipCode')) if data.get('UserZipCode') else None
            
        update_query = """
            UPDATE Users 
            SET UserFName = %s, 
                UserLName = %s, 
                Username = %s, 
                UserEmail = %s, 
                UserPhone = %s, 
                UserBio = %s, 
                UserAddress = %s, 
                UserSecAddress = %s, 
                UserCity = %s, 
                UserState = %s, 
                UserZipCode = %s
            WHERE UserID = %s
        """
        cursor.execute(update_query, (
            data.get('UserFName'),
            data.get('UserLName'),
            data.get('Username'),
            data.get('UserEmail'),
            phone,
            data.get('UserBio'),
            address,
            sec_address,
            city,
            state,
            zipcode,
            user_id
        ))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Sponsor user updated successfully'
        })
            
    except Exception as e:
        conn.rollback()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@sponsor.route('/sponsor/timeframe/<sponsor_name>', methods=['GET'])
def get_sponsor_timeframe(sponsor_name):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT SponsorTimeFrame 
            FROM Sponsor 
            WHERE SponsorCompanyName = %s;
        """
        cursor.execute(query, (sponsor_name,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if result:
            return jsonify({
                'success': True, 
                'timeFrame': result['SponsorTimeFrame']
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Sponsor not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': str(e)
        }), 500
    
@sponsor.route('/sponsor/timeframe', methods=['POST'])
def set_sponsor_timeframe():
    try:
        data = request.get_json()
        sponsor_name = data.get('sponsorName')
        time_frame = data.get('timeFrame')

        if not sponsor_name or not time_frame:
            return jsonify({
                'success': False, 
                'message': 'Sponsor name and time frame are required'
            }), 400

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Check the current time frame
        check_query = """
            SELECT SponsorTimeFrame 
            FROM Sponsor 
            WHERE SponsorCompanyName = %s
        """
        cursor.execute(check_query, (sponsor_name,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False, 
                'message': 'Sponsor not found'
            }), 404

        current_time_frame = result[0]

        # If the time frame is the same, return success without updating
        if current_time_frame == time_frame:
            cursor.close()
            conn.close()
            return jsonify({
                'success': True, 
                'message': 'Time frame already set to the selected value'
            })

        # Update the sponsor's time frame
        update_query = """
            UPDATE Sponsor 
            SET SponsorTimeFrame = %s 
            WHERE SponsorCompanyName = %s
        """
        cursor.execute(update_query, (time_frame, sponsor_name))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True, 
            'message': 'Time frame updated successfully'
        })
            
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': str(e)
        }), 500

@sponsor.route('/sponsor/points', methods=['GET'])    
def get_point_value():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Query to fetch the current point value
        query = """
        SELECT s.SponsorPointValue 
        FROM SponsorUser su
        JOIN Sponsor s ON su.SponsorID = s.SponsorID
        WHERE su.UserID = %s;
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        # If the result is empty, return an error message
        if result is None:
            return jsonify({"error": "Sponsor not found"}), 404

        # Return the point value as a response
        return jsonify({"point_value": result[0]}), 200

    except mysql.connector.Error as e:
        # Handle any database errors
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/points', methods=['POST'])    
def set_point_value():
    data = request.get_json()
    user_id = data.get('user_id')
    new_point_value = data.get('new_point_value')

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400
    if not new_point_value:
        return jsonify({"error": "Missing new_point_value parameter"}), 400

    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Query to edit the sponsor organization's point value
        query = """
        UPDATE Sponsor s
        JOIN SponsorUser su ON s.SponsorID = su.SponsorID
        SET SponsorPointValue= %s 
        WHERE su.UserID= %s;
        """
        cursor.execute(query, (new_point_value, user_id))
        conn.commit()

        # Check if any rows were updated
        if cursor.rowcount == 0:
            return jsonify({"error": "Sponsor not found"}), 404

        # Return a success message
        return jsonify({"message": "Point value updated successfully."}), 200

    except mysql.connector.Error as e:
        # Handle any database errors
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/points/transaction', methods=['POST'])
def create_transaction():
    # Extracting the data from the request
    driver_relation_id = request.json.get('driver_relation_id')
    transaction_amount = request.json.get('transaction_amount')
    transaction_reason = request.json.get('transaction_reason')

    # Validating required fields
    if not all([driver_relation_id, transaction_amount, transaction_reason]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Setting up the database connection
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Getting the current date and time for the transaction
        transaction_date = datetime.now()

        # Creating the SQL query to insert the transaction
        transaction_query = """
            INSERT INTO Transaction (DriverRelationID, TransactionDate, TransactionChange, TransactionReason)
            VALUES (%s, %s, %s, %s)
        """

        # Executing the query
        cursor.execute(transaction_query, (driver_relation_id, transaction_date, transaction_amount, transaction_reason))
        conn.commit()

        # Returning a success response
        return jsonify({"message": "Transaction created successfully."}), 201

    except mysql.connector.Error as e:
        # Handling any errors with the database
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        # Closing the connection
        cursor.close()
        conn.close()

@sponsor.route('/sponsor/presets', methods=['GET'])
def get_presets():
    user_id = request.args.get('user_id')
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    query = """SELECT PresetID, PresetPointValue, PresetReason
    FROM SponsorPreset sp JOIN SponsorUser su ON sp.SponsorID = su.SponsorID
    WHERE su.UserID = %s"""
    cursor.execute(query, (user_id,))
    presets = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'presets': presets})

@sponsor.route('/sponsor/presets/add', methods=['POST'])
def add_preset():
    data = request.json
    user_id = data.get('user_id')
    point_value = data.get('point_value')
    reason = data.get('reason')


    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    id_query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s"
    cursor.execute(id_query, (user_id,))
    sponsor_id = cursor.fetchone()[0]

    query = "INSERT INTO SponsorPreset (SponsorID, PresetPointValue, PresetReason) VALUES (%s, %s, %s)"
    cursor.execute(query, (sponsor_id, point_value, reason))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'Preset added successfully'})

@sponsor.route('/sponsor/presets/delete', methods=['POST'])
def delete_preset():
    data = request.json
    preset_id = data.get('preset_id')

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    query = "DELETE FROM SponsorPreset WHERE PresetID = %s"
    cursor.execute(query, (preset_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'success': True, 'message': 'Preset deleted successfully'})

@sponsor.route('/sponsor/sponsor-users/<sponsor_id>', methods=['GET'])
def get_sponsor_users(sponsor_id):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, u.UserPhone, 
                u.UserAddress, u.UserSecAddress, u.UserCity, u.UserState, u.UserZipCode, u.UserBio
        FROM Users u
        JOIN SponsorUser su ON u.UserID = su.UserID
        WHERE su.SponsorID = %s AND UserIsActive = 1
    """
    
    cursor.execute(query, [sponsor_id])
    sponsors = cursor.fetchall()
    
    cursor.close()
    conn.close()

    if sponsors:
        decrypted_sponsors = []
        for sponsor in sponsors:
            decrypted_phone = crypt.decrypt(sponsor['UserPhone'])

            address_parts = []
            address_parts.append(f"{crypt.decrypt(sponsor['UserAddress'])}, ")
            if sponsor['UserSecAddress']:
                address_parts.append(f"{crypt.decrypt(sponsor['UserSecAddress'])}, ")
            address_parts.append(f"{crypt.decrypt(sponsor['UserCity'])}, {crypt.decrypt(sponsor['UserState'])} {crypt.decrypt(sponsor['UserZipCode'])}")

            decrypted_address = "\n".join(filter(None, address_parts)) if address_parts else None

            decrypted_sponsors.append({
                'UserID': sponsor['UserID'],
                'Username': sponsor['Username'],
                'UserFName': sponsor['UserFName'],
                'UserLName': sponsor['UserLName'],
                'UserEmail': sponsor['UserEmail'],
                'UserPhone': decrypted_phone,
                'UserAddress': decrypted_address,
                'UserBio': sponsor['UserBio']
            })

        return jsonify({'success': True, 'sponsors': decrypted_sponsors})
    else:
        return jsonify({'success': False, 'message': 'Sponsor user not found'}), 404
    
@sponsor.route('/sponsor/all', methods=['GET'])
def get_all_sponsors():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Correct SQL query
        cursor.execute("SELECT SponsorID, SponsorCompanyName FROM Sponsor")
        sponsors = cursor.fetchall()

        cursor.close()
        conn.close()

        # Return the full sponsor info
        return jsonify({'success': True, 'sponsors': sponsors})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
