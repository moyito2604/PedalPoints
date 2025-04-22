from flask import Blueprint, jsonify, request, send_file
from io import BytesIO
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
import os
import crypt

users = Blueprint("users", __name__)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None), #password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}


@users.route('/login', methods=['POST'])
def login():
    # Get the username and password from the request data
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"})

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)

        # Check if the user exists in the Users table and is active
        query = "SELECT UserID, UserFName, UserLName, Username, UserPassword FROM Users WHERE Username = %s AND UserIsActive = 1;"
        cursor.execute(query, [username])
        user = cursor.fetchone()

        if user is None:
            return jsonify({"success": False, "message": "User does not exist"})

        user_id = user['UserID']

        # Check if the user is an Admin
        cursor.execute("SELECT UserID FROM Admin WHERE UserID = %s;", [user_id])
        is_admin = cursor.fetchone()

        # If not admin, check if the user is a SponsorUser
        if not is_admin:
            cursor.execute("SELECT UserID FROM SponsorUser WHERE UserID = %s;", [user_id])
            is_sponsor = cursor.fetchone()
        else:
            is_sponsor = None

        if is_admin:
            role = "Admin"
        elif is_sponsor:
            role = "Sponsor"
        else:
            role = "Driver"

        # Validate password
        if not check_password_hash(user['UserPassword'], password):
            query = "INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) VALUES (%s, %s, %s, %s);"
            cursor.execute(query, [datetime.today().strftime('%Y-%m-%d %H:%M:%S'), user_id, f"{role} Invalid Login",
                                   f"Invalid Login for user {user['Username']}"])
            conn.commit()
            return jsonify({"success": False, "message": "Invalid Username or Password"})

        query = "INSERT INTO AuditLog (AuditLogDate, UserID, AuditType, AuditDetails) VALUES (%s, %s, %s, %s);"
        cursor.execute(query, [datetime.today().strftime('%Y-%m-%d %H:%M:%S'), user_id, f"{role} Successful Login",
                               f"Successful Login for user {user['Username']}"])
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Login Successful",
            "user": {
                "id": user_id,
                "username": user['Username'],
                "firstname": user['UserFName'],
                "lastname": user['UserLName'],
                "role": role.lower()
            }
        })

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})


@users.route('/user/create', methods=['POST'])
def create_user():
    data = request.get_json()
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

    if not username or not password or not firstname or not lastname or not phone or not primary_address or not city or not state or not zipcode:
        return jsonify({"success": False, "message": "Missing Argument"})

    phone = crypt.encrypt(phone)
    primary_address = crypt.encrypt(primary_address)
    if secondary_address:
        secondary_address = crypt.encrypt(secondary_address)
    city = crypt.encrypt(city)
    state = crypt.encrypt(state)
    zipcode = crypt.encrypt(zipcode)

    hashed_password = generate_password_hash(password)

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)

        # Check if the user already exists
        query = "SELECT Username FROM Users WHERE Username=%s;"
        cursor.execute(query, [username])
        row = cursor.fetchone()

        if row is not None:
            return jsonify({"success": False, "message": "User already exists"})

        # Call Stored Procedure to insert new Driver User
        cursor.callproc("ADD_DRIVER",
                        args=(firstname, lastname, username, hashed_password, phone, email, primary_address, city, state, zipcode, secondary_address))

        conn.commit()

        return jsonify({"success": True, "message": f"User {username} created successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"})
    
    finally:
        # Always close the cursor and connection
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@users.route('/user/get-user-details/<username>', methods=['GET'])
def get_user_details(username):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # Query to get the user's phone number, email, and shipping address
    contact_query = """
        SELECT UserPhone, UserEmail, UserAddress, UserCity, UserState, UserZipCode, UserSecAddress, UserBio
        FROM Users 
        WHERE Username = %s;
    """
    cursor.execute(contact_query, (username,))
    contact_result = cursor.fetchone()

    # Query to get the user's SponsorCompanyName, DriverPoints, DriverTruckInfo, and DriverStatus
    sponsor_query = """
        SELECT s.SponsorCompanyName, s.SponsorContact, s.SponsorEmail, dr.DriverPoints, di.DriverTruckInfo, dr.DriverStatus
        FROM Users u
        LEFT JOIN DriverInfo di ON u.UserID = di.UserID
        LEFT JOIN DriverRelation dr ON u.UserID = dr.UserID
        LEFT JOIN Sponsor s ON dr.SponsorID = s.SponsorID
        WHERE u.Username = %s;
    """
    cursor.execute(sponsor_query, (username,))
    sponsor_results = cursor.fetchall()

    conn.close()

    if contact_result:
        decrypted_phone = crypt.decrypt(contact_result['UserPhone'])

        address_parts = []
        address_parts.append(f"{crypt.decrypt(contact_result['UserAddress'])}, ")
        if contact_result['UserSecAddress']:
            address_parts.append(f"{crypt.decrypt(contact_result['UserSecAddress'])}, ")
        address_parts.append(f"{crypt.decrypt(contact_result['UserCity'])}, {crypt.decrypt(contact_result['UserState'])} {crypt.decrypt(contact_result['UserZipCode'])}")
    
        decrypted_address = "\n".join(filter(None, address_parts)) if address_parts else None
        bio = contact_result['UserBio']

        driver_truck_info = None
        approved_sponsors = []

        for sponsor in sponsor_results:
            # Set DriverTruckInfo once (assumes all rows have the same value)
            if driver_truck_info is None:
                driver_truck_info = sponsor['DriverTruckInfo']

            # Add only approved sponsors (DriverStatus = 2)
            if sponsor['DriverStatus'] == 2:
                approved_sponsors.append({
                    'sponsorCompanyName': sponsor['SponsorCompanyName'],
                    'sponsorContact': crypt.decrypt(sponsor['SponsorContact']) if sponsor['SponsorContact'] else None,
                    'sponsorEmail': crypt.decrypt(sponsor['SponsorEmail']) if sponsor['SponsorEmail'] else None,
                    'driverPoints': sponsor['DriverPoints']
                })
        
        return jsonify({
            'success': True,
            'phoneNumber': decrypted_phone,
            'email': contact_result['UserEmail'],
            'shippingAddress': decrypted_address,
            'bio': bio,
            'driverTruckInfo': driver_truck_info,
            'approvedSponsors': approved_sponsors  # List of approved sponsors
        })
    else:
        return jsonify({'success': False, 'message': 'User not found'}), 404


@users.route('/user/profile-picture/<username>', methods=['GET'])
def get_pfp(username):
    query = "SELECT UserPFP FROM Users WHERE Username=%s"
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, [username])
    row = cursor.fetchone()

    img_data = None
    response_body = {}

    if row is not None and row["UserPFP"] is not None:
        file_path = os.path.join(os.getcwd(), "profile_pictures", row["UserPFP"])
        if not os.path.exists(file_path):
            response_body = jsonify({"success": False, "message": "File not found"}), 404
        else:
            with open(file_path, "rb") as img:
                img_data = BytesIO(img.read())
    else:
        response_body = jsonify({"success": False, "message": "Username does not exist"})

    conn.close()
    if img_data:
        return send_file(img_data, download_name=row["UserPFP"])
    else:
        return response_body
    
@users.route('/user/submit-application', methods=['POST'])
def submit_application():
    data = request.get_json()
    username = data.get('username')
    years_of_driving = data.get('yearsOfDriving')
    sponsor_name = data.get('sponsorName')
    reason = data.get('reason')

    if not username or not years_of_driving or not sponsor_name:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get UserID from username
        cursor.execute("SELECT UserID FROM Users WHERE Username = %s", [username])
        user_result = cursor.fetchone()
        if not user_result:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        user_id = user_result['UserID']

        # Get SponsorID from sponsor name
        cursor.execute("SELECT SponsorID FROM Sponsor WHERE SponsorCompanyName = %s", [sponsor_name])
        sponsor_result = cursor.fetchone()
        if not sponsor_result:
            return jsonify({"success": False, "message": "Sponsor not found"}), 404
        
        sponsor_id = sponsor_result['SponsorID']

        # Update DriverExp in DriverInfo table
        cursor.execute("SELECT * FROM DriverInfo WHERE UserID = %s", [user_id])
        driver_info_exists = cursor.fetchone()
        
        if driver_info_exists:
            # Update existing record
            cursor.execute("UPDATE DriverInfo SET DriverExp = %s WHERE UserID = %s", 
                          [years_of_driving, user_id])
        else:
            # Insert new record
            cursor.execute("INSERT INTO DriverInfo (UserID, DriverExp) VALUES (%s, %s)", 
                          [user_id, years_of_driving])

        # Check if there's already an active application for this user
        cursor.execute("""
            SELECT * FROM DriverRelation 
            WHERE UserID = %s AND SponsorID = %s AND DriverStatus IN (1, 2)
        """, [user_id, sponsor_id])
        
        existing_application = cursor.fetchone()
        
        if existing_application:
            return jsonify({
                "success": False, 
                "message": "You already have a pending or approved application with this sponsor"
            }), 400

        # Insert new record in DriverRelation table
        cursor.execute("""
            INSERT INTO DriverRelation 
            (UserID, SponsorID, DriverReason, DriverStatus, DriverPoints) 
            VALUES (%s, %s, %s, 1, 0)
        """, [user_id, sponsor_id, reason])

        # Commit changes
        conn.commit()
        
        return jsonify({
            "success": True, 
            "message": "Driver application submitted successfully"
        })

    except Error as e:
        # Roll back changes in case of error
        if conn and conn.is_connected():
            conn.rollback()
        
        return jsonify({
            "success": False, 
            "message": f"Database error: {str(e)}"
        }), 500
        
    finally:
        # Close database connection
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@users.route('/users/applications/<username>', methods=['GET'])
def get_driver_applications(username):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT s.SponsorCompanyName, 
                   CASE dr.DriverStatus
                       WHEN 0 THEN 'Rejected'
                       WHEN 1 THEN 'Pending'
                       WHEN 2 THEN 'Accepted'
                       WHEN 3 THEN 'Removed'
                       ELSE 'Unknown'
                   END AS ApplicationStatus,
                   dr.SponsorReason AS ApplicationReason
            FROM DriverRelation dr
            JOIN Sponsor s ON dr.SponsorID = s.SponsorID
            JOIN Users u ON dr.UserID = u.UserID
            WHERE u.Username = %s;
        """
        
        cursor.execute(query, (username,))
        applications = cursor.fetchall()

        return jsonify({"success": True, "applications": applications})
    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@users.route('/user/points', methods=['GET'])
def get_user_points():
    user_id = request.args.get('user_id')
    sponsor_id = request.args.get('sponsor_id')

    if not user_id or not sponsor_id:
        return jsonify({'success': False, 'message': 'Missing user_id or sponsor_id'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Get current points with the selected sponsor
        cursor.execute("""
            SELECT DriverPoints 
            FROM DriverRelation 
            WHERE UserID = %s AND SponsorID = %s
        """, (user_id, sponsor_id))
        points_result = cursor.fetchone()
        current_points = points_result['DriverPoints'] if points_result else 0

        # Get lifetime total points (sum of all transactions)
        cursor.execute("""
            SELECT SUM(TransactionChange) AS lifetime_points 
            FROM Transaction 
            WHERE DriverRelationID IN (
                SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s
            )
        """, (user_id, sponsor_id))
        lifetime_result = cursor.fetchone()
        lifetime_points = lifetime_result['lifetime_points'] if lifetime_result and lifetime_result['lifetime_points'] else 0

        # Get all transactions with this sponsor
        cursor.execute("""
            SELECT TransactionDate, TransactionChange, TransactionReason 
            FROM Transaction 
            WHERE DriverRelationID IN (
                SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s
            )
            ORDER BY TransactionDate DESC
        """, (user_id, sponsor_id))
        transactions = cursor.fetchall()

        conn.close()

        return jsonify({
            'success': True,
            'current_points': current_points,
            'lifetime_points': lifetime_points,
            'transactions': transactions
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@users.route('/user/sponsors', methods=['GET'])
def get_user_sponsors():
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'success': False, 'message': 'Missing user_id'}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Fetch all sponsors associated with the given user
        cursor.execute("""
            SELECT s.SponsorID, s.SponsorCompanyName 
            FROM Sponsor s
            JOIN DriverRelation dr ON s.SponsorID = dr.SponsorID
            WHERE dr.UserID = %s AND dr.DriverStatus = 2
        """, (user_id,))

        sponsors = cursor.fetchall()
        conn.close()

        return jsonify({'success': True, 'sponsors': sponsors})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
@users.route('/user/get-notifications/<username>', methods=['GET'])
def get_user_notifications(username):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("going to query\n")

        query = """
            SELECT s.UserID
            FROM Users s
            WHERE s.Username = %s
        """

        cursor.execute(query, (username,))
        user = cursor.fetchone()

        user_id = user['UserID']

        query = """
            SELECT s.NotificationType, s.NotificationDetails, s.NotificationDate, s.NotificationID
            FROM Notification s
            WHERE s.UserID = %s AND s.NotificationAck = 0;
        """
        
        cursor.execute(query, (user_id,))
        notifications = cursor.fetchall()

        print(notifications)

        if notifications:
            return jsonify({'success': True, 'notifications': notifications}), 200
        else:
            return jsonify({'false': True, 'message': 'No notifications found for this user'}), 200

    except mysql.connector.Error as e:
        return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@users.route('/user/remove-notification', methods=['DELETE'])
def remove_user_notification():
    try:
        # Assuming the user is authenticated and their username is passed as a query parameter
        username = request.json.get('username')  # User's username
        notification_id = request.json.get('notification_id')  # ID of the notification to remove
        
        if not username or not notification_id:
            return jsonify({'success': False, 'message': 'Username and Notification ID are required'}), 400
        
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get the user ID for the provided username
        query = """
            SELECT UserID
            FROM Users
            WHERE Username = %s
        """
        cursor.execute(query, (username,))
        user_id = cursor.fetchone()
        
        if not user_id:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Check if the notification exists and belongs to the user
        query = """
            SELECT NotificationID
            FROM Notification
            WHERE NotificationID = %s AND UserID = %s
        """
        cursor.execute(query, (notification_id, user_id['UserID']))
        notification = cursor.fetchone()
        
        if not notification:
            return jsonify({'success': False, 'message': 'Notification not found or does not belong to this user'}), 404
        
        # Ack the notification
        query = """
            UPDATE Notification
            SET NotificationAck = 1
            WHERE NotificationID = %s AND UserID = %s
        """
        cursor.execute(query, (notification_id, user_id['UserID']))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Notification Acknowledged successfully'}), 200
    
    except mysql.connector.Error as e:
        return jsonify({'success': False, 'message': f"Database error: {str(e)}"}), 500
    
    finally:
        cursor.close()
        conn.close()