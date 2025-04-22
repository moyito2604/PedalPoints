from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
import os
import crypt

admin = Blueprint("admin", __name__)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None), #password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}

@admin.route('/admin/get-admin-details/<username>', methods=['GET'])
def get_admin_details(username):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    admin_query = """
        SELECT *
        FROM Users JOIN Admin USING (UserID)
        WHERE Username = %s AND UserIsActive = 1;
    """

    cursor.execute(admin_query, (username,))
    admin_result = cursor.fetchone()

    conn.close()

    if admin_result:
        decrypted_phone = crypt.decrypt(admin_result['UserPhone'])

        address_parts = []
        address_parts.append(f"{crypt.decrypt(admin_result['UserAddress'])}, ")
        if admin_result['UserSecAddress']:
            address_parts.append(f"{crypt.decrypt(admin_result['UserSecAddress'])}, ")
        address_parts.append(f"{crypt.decrypt(admin_result['UserCity'])}, {crypt.decrypt(admin_result['UserState'])} {crypt.decrypt(admin_result['UserZipCode'])}")

        decrypted_address = "\n".join(filter(None, address_parts)) if address_parts else None
        bio = admin_result['UserBio']

        return jsonify({
            'success': True,
            'phoneNumber': decrypted_phone,
            'email': admin_result['UserEmail'],
            'shippingAddress': decrypted_address,
            'bio': bio
        })
    

    else:
        return jsonify({'success': False, 'message': 'Admin user not found'}), 404


@admin.route('/admin/create', methods=['POST'])
def create_user():
    data = request.get_json()
    user_id = data.get('user_id')  # This is the logged-in admin user's ID from localStorage

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
    role = data.get('role')  # 'driver' or 'sponsor' or 'admin'

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

        # Get Admin Status from Stored UserID
        admin_query = "SELECT * FROM Admin WHERE UserID = %s"
        cursor.execute(admin_query, (user_id,))
        admin_data = cursor.fetchone()

        if not admin_data:
            return jsonify({"success": False, "message": "Unauthorized User"}), 404

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

        elif role == "sponsor":
            # Ensure Sponsor exists
            sponsor = data.get("sponsor_name")
            query = "SELECT SponsorID FROM Sponsor WHERE SponsorCompanyName=%s;"
            cursor.execute(query, (sponsor,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"success": False, "message": "Sponsor does not exist"})

            # Insert the new user using the ADD_SPONSOR_USER stored procedure
            cursor.callproc("ADD_SPONSOR_USER", (
                firstname, lastname, username, hashed_password, phone, email, primary_address,
                city, state, zipcode, secondary_address, result["SponsorID"]
            ))

        else:
            # Insert the new user using ADD_DRIVER stored procedure
            cursor.callproc("ADD_ADMIN", (
                firstname, lastname, username, hashed_password, phone, email, primary_address,
                city, state, zipcode, secondary_address
            ))

        conn.commit()

        return jsonify({"success": True, "message": f"User {username} created successfully"})

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/create-org', methods=['POST'])
def create_sponsor_orq():
    data = request.get_json()
    user_id = data.get('user_id')  # This is the logged-in admin user's ID from localStorage

    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    # Extract new organization details
    name = data.get('companyName')
    phone = data.get('phoneNumber')
    email = data.get('email')

    if not all([name, phone, email]):
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    phone = crypt.encrypt(phone)
    email = crypt.encrypt(email)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        # Get Admin Status from Stored UserID
        admin_query = "SELECT * FROM Admin WHERE UserID = %s"
        cursor.execute(admin_query, (user_id,))
        admin_data = cursor.fetchone()

        if not admin_data:
            return jsonify({"success": False, "message": "Unauthorized User"}), 404

        # Check if the Organization Name already exists
        cursor.execute("SELECT SponsorID FROM Sponsor WHERE SponsorCompanyName=%s;", (name,))
        if cursor.fetchone():
            return jsonify({"success": False, "message": "Sponsor already exists"}), 400

        query = "INSERT INTO Sponsor (SponsorCompanyName, SponsorContact, SponsorPointValue, SponsorEmail) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (name, phone, 0.01, email))

        conn.commit()

        return jsonify({"success": True, "message": f"Sponsor Organization \"{name}\" created successfully"})

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/send-notification', methods=['POST'])
def send_notification():
    data = request.get_json()
    admin_user_id = data.get('user_id')  # this is the admin's ID (sender), not recipients
    notification_type = data.get('notificationType')
    notification_details = data.get('notificationDetails')
    user_type = data.get('userType')
    user_ids = data.get('userIds', [])

    if not notification_type or not notification_details:
        return jsonify({"success": False, "message": "Missing notification details"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        if user_type == "Driver":
            if user_ids:
                # Send to specific drivers
                for uid in user_ids:
                    cursor.execute("SELECT UserID FROM DriverInfo WHERE UserID = %s", (uid,))
                    driver = cursor.fetchone()
                    if driver:
                        cursor.execute(
                            "INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate) VALUES (%s, %s, %s, NOW())",
                            (uid, notification_type, notification_details)
                        )
                    else:
                        return jsonify({"success": False, "message": f"User {uid} is not a driver"}), 400
            else:
                # Send to all drivers
                cursor.execute("SELECT UserID FROM DriverInfo")
                drivers = cursor.fetchall()
                for driver in drivers:
                    cursor.execute(
                        "INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate) VALUES (%s, %s, %s, NOW())",
                        (driver["UserID"], notification_type, notification_details)
                    )

        elif user_type == "Sponsor":
            if user_ids:
                # Send to specific sponsors
                for uid in user_ids:
                    cursor.execute("SELECT UserID FROM SponsorUser WHERE UserID = %s", (uid,))
                    sponsor = cursor.fetchone()
                    if sponsor:
                        cursor.execute(
                            "INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate) VALUES (%s, %s, %s, NOW())",
                            (uid, notification_type, notification_details)
                        )
                    else:
                        return jsonify({"success": False, "message": f"User {uid} is not a sponsor"}), 400
            else:
                # Send to all sponsors
                cursor.execute("SELECT UserID FROM SponsorUser")
                sponsors = cursor.fetchall()
                for sponsor in sponsors:
                    cursor.execute(
                        "INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate) VALUES (%s, %s, %s, NOW())",
                        (sponsor["UserID"], notification_type, notification_details)
                    )
        else:
            return jsonify({"success": False, "message": "Invalid user type"}), 400

        conn.commit()
        return jsonify({"success": True, "message": "Notification sent successfully"})

    except Exception as e:
        print("Error sending notification:", str(e))
        return jsonify({"success": False, "message": "Internal server error"}), 500

    finally:
        cursor.close()
        conn.close()



def send_to_driver(driver_id, notification_type, notification_details):
    # Implement the logic to send the notification, e.g., store it in the Notification table
    query = """
        INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate)
        VALUES (%s, %s, %s, NOW())
    """
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    cursor.execute(query, (driver_id, notification_type, notification_details))
    conn.commit()

    cursor.close()
    conn.close()

@admin.route('/admin/users', methods=['GET'])
def get_users():
    admin_id = request.args.get('admin_id')
    
    if not admin_id:
        return jsonify({"success": False, "message": "Missing admin_id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Verify admin status
        cursor.execute("SELECT 1 FROM Admin WHERE UserID = %s", (admin_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Unauthorized access"}), 401

        # Query to get all users with their roles
        query = """
            SELECT 
                u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, 
                u.UserBio, u.UserPhone, u.UserAddress, u.UserSecAddress, u.UserCity, 
                u.UserState, u.UserZipCode, u.UserIsActive,
                CASE WHEN d.UserID IS NOT NULL THEN 1 ELSE 0 END AS isDriver,
                CASE WHEN s.UserID IS NOT NULL THEN 1 ELSE 0 END AS isSponsor,
                CASE WHEN a.UserID IS NOT NULL THEN 1 ELSE 0 END AS isAdmin
            FROM Users u
            LEFT JOIN DriverInfo d ON u.UserID = d.UserID
            LEFT JOIN SponsorUser s ON u.UserID = s.UserID
            LEFT JOIN Admin a ON u.UserID = a.UserID
            ORDER BY u.UserFName, u.UserLName
        """
        cursor.execute(query)
        users = cursor.fetchall()

        # Decrypt sensitive data
        for user in users:
            if user['UserPhone']:
                user['UserPhone'] = crypt.decrypt(user['UserPhone'])
            if user['UserAddress']:
                user['UserAddress'] = crypt.decrypt(user['UserAddress'])
            if user['UserSecAddress']:
                user['UserSecAddress'] = crypt.decrypt(user['UserSecAddress'])
            if user['UserCity']:
                user['UserCity'] = crypt.decrypt(user['UserCity'])
            if user['UserState']:
                user['UserState'] = crypt.decrypt(user['UserState'])
            if user['UserZipCode']:
                user['UserZipCode'] = crypt.decrypt(user['UserZipCode'])

        return jsonify({
            "success": True,
            "users": users
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@admin.route('/admin/user/<user_id>', methods=['GET'])
def get_user_details(user_id):
    admin_id = request.args.get('admin_id')
    
    if not admin_id:
        return jsonify({"success": False, "message": "Missing admin_id"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Verify admin status
        cursor.execute("SELECT 1 FROM Admin WHERE UserID = %s", (admin_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Unauthorized access"}), 401

        # Get user details
        cursor.execute("""
            SELECT 
                u.UserID, u.Username, u.UserFName, u.UserLName, u.UserEmail, 
                u.UserBio, u.UserPhone, u.UserAddress, u.UserSecAddress,
                u.UserCity, u.UserState, u.UserZipCode
            FROM Users u
            WHERE u.UserID = %s
        """, (user_id,))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Decrypt sensitive information
        if user_data['UserPhone']:
            user_data['UserPhone'] = crypt.decrypt(user_data['UserPhone'])
        if user_data['UserAddress']:
            user_data['UserAddress'] = crypt.decrypt(user_data['UserAddress'])
        if user_data['UserSecAddress']:
            user_data['UserSecAddress'] = crypt.decrypt(user_data['UserSecAddress'])
        if user_data['UserCity']:
            user_data['UserCity'] = crypt.decrypt(user_data['UserCity'])
        if user_data['UserState']:
            user_data['UserState'] = crypt.decrypt(user_data['UserState'])
        if user_data['UserZipCode']:
            user_data['UserZipCode'] = crypt.decrypt(user_data['UserZipCode'])

        # Check if user is a driver and get driver-specific info
        cursor.execute("""
            SELECT DriverTruckInfo, DriverStatus
            FROM DriverInfo d
            JOIN DriverRelation dr ON d.UserID = dr.UserID
            WHERE d.UserID = %s
        """, (user_id,))
        driver_info = cursor.fetchone()

        return jsonify({
            "success": True,
            "user": user_data,
            "driverInfo": driver_info
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@admin.route('/admin/update-user/<user_id>/<user_type>', methods=['PUT'])
def update_user_info(user_id, user_type):
    data = request.get_json()
    admin_id = data.get('admin_id')
    
    if not admin_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Verify admin status
        cursor.execute("SELECT 1 FROM Admin WHERE UserID = %s", (admin_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Unauthorized access"}), 401

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
            user_id
        ))

        # Handle user type specific updates
        if user_type == 'driver' and data.get('driverInfo'):
            driver_info = data.get('driverInfo')
            
            # Check if driver already exists in DriverInfo
            cursor.execute("SELECT 1 FROM DriverInfo WHERE UserID = %s", (user_id,))
            if cursor.fetchone():
                # Update existing driver info
                cursor.execute("""
                    UPDATE DriverInfo
                    SET DriverTruckInfo = %s
                    WHERE UserID = %s
                """, (
                    driver_info.get('DriverTruckInfo'),
                    user_id
                ))
            else:
                # Insert new driver info
                cursor.execute("""
                    INSERT INTO DriverInfo (UserID, DriverTruckInfo)
                    VALUES (%s, %s)
                """, (
                    user_id,
                    driver_info.get('DriverTruckInfo')
                ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "User information updated successfully"
        })

    except mysql.connector.Error as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

# Get all drivers and sponsors
@admin.route('/admin/assign-sponsor', methods=['GET'])
def get_assign_data():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""SELECT u.UserID, u.UserFName, u.UserLName, u.Username FROM Users u
                   JOIN DriverInfo di ON u.UserID = di.UserID WHERE u.UserIsActive = 1""")
    drivers = cursor.fetchall()

    cursor.execute("SELECT SponsorID, SponsorCompanyName FROM Sponsor")
    sponsors = cursor.fetchall()

    conn.close()
    return jsonify({'drivers': drivers, 'sponsors': sponsors}), 200

# Assign or update sponsor for a driver
@admin.route('/admin/assign-sponsor', methods=['POST'])
def assign_sponsor():
    data = request.json
    driver_id = data['driver_id']
    sponsor_id = data['sponsor_id']

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM DriverRelation
        WHERE UserID = %s AND SponsorID = %s
    """, (driver_id, sponsor_id))

    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE DriverRelation
            SET DriverStatus = 2, DriverReason = 'Assigned by Admin',
            SponsorReason = 'Assigned by Admin'
            WHERE UserID = %s AND SponsorID = %s
        """, (driver_id, sponsor_id))
    else:
        cursor.execute("""
            INSERT INTO DriverRelation (UserID, SponsorID, DriverReason, DriverStatus, DriverPoints, SponsorReason)
            VALUES (%s, %s, 'Assigned by Admin', 2, 0, 'Assigned by Admin')
        """, (driver_id, sponsor_id))

    conn.commit()
    conn.close()
    return jsonify({'message': 'Sponsor assigned to driver'}), 200

# Reactivate users
@admin.route('/admin/reactivate-user', methods=['POST'])
def reactivate_user():
    data = request.json
    user_id = data['UserID']

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE Users SET UserIsActive = 1
        WHERE UserID = %s
    """, (user_id,))

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'User reactivated'}), 200

# Deactivate users
@admin.route('/admin/deactivate-user', methods=['POST'])
def deactivate_user():
    data = request.json
    user_id = data['UserID']

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE Users SET UserIsActive = 0
        WHERE UserID = %s
    """, (user_id,))

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'User deactivated'}), 200