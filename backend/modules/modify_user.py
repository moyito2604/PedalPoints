from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from mysql.connector import Error
import os
import uuid
import crypt

modify_user = Blueprint("modify_user", __name__)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None), #password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}


@modify_user.route('/user/modify/password', methods=['POST'])
def modify_password():
    data = request.get_json()
    username = data.get('username')
    old_pass = data.get('old_pass')
    new_pass = data.get('new_pass')

    if not username or not old_pass or not new_pass:
        return jsonify({"error": "Missing Argument"})

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    # SQL injection attack prevention with parameterized queries
    query = "SELECT UserPassword FROM Users WHERE Username=%s;"
    cursor.execute(query, [username])
    row = cursor.fetchone()

    if row is not None:
        sql_pass = row['UserPassword']
        if check_password_hash(sql_pass, old_pass):
            query = "UPDATE Users SET UserPassword=%s WHERE Username=%s;"
            cursor.execute(query, [generate_password_hash(new_pass), username])
            conn.commit()
            response_body = {"success": True, "message": "Password Changed Successfully"}
        else:
            response_body = {"success": False, "message": "Incorrect Old Password"}
    else:
        response_body = {"success": False, "message": "Username does not exist"}

    # Close the connection
    conn.close()
    return jsonify(response_body)


@modify_user.route('/user/modify/username', methods=['POST'])
def modify_username():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    new_user = data.get('new_user')

    if not username or not password or not password:
        return jsonify({"error": "Missing Argument"})

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    # SQL injection attack prevention with parameterized queries
    query = "SELECT UserPassword FROM Users WHERE Username=%s;"
    cursor.execute(query, [username])
    row = cursor.fetchone()

    if row is not None:
        sql_pass = row['UserPassword']
        if check_password_hash(sql_pass, password):
            query = "UPDATE Users SET Username=%s WHERE Username=%s;"
            cursor.execute(query, [new_user, username])
            conn.commit()
            response_body = {"success": True, "message": "Username Changed Successfully"}
        else:
            response_body = {"success": False, "message": "Incorrect Password"}
    else:
        response_body = {"success": False, "message": "Username does not exist"}

    # Close the connection
    conn.close()
    return jsonify(response_body)

@modify_user.route('/user/modify/name', methods=['POST'])
def modify_name():
    data = request.get_json()
    username = data.get('username')
    new_fname = data.get('new_fname')
    new_lname = data.get('new_lname')

    if not username or (not new_fname and not new_lname):
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Build update query based on provided fields
        update_fields = []
        params = []
        
        if new_fname:
            update_fields.append("UserFName=%s")
            params.append(new_fname)
        
        if new_lname:
            update_fields.append("UserLName=%s")
            params.append(new_lname)
        
        params.append(username)
        
        query = f"UPDATE Users SET {', '.join(update_fields)} WHERE Username=%s;"
        cursor.execute(query, params)
        conn.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"success": True, "message": "Name updated successfully"})
        else:
            return jsonify({"success": False, "message": "Username does not exist or no changes made"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@modify_user.route('/user/modify/phone', methods=['POST'])
def modify_phone():
    data = request.get_json()
    username = data.get('username')
    new_phone = data.get('new_phone')

    if not username or not new_phone:
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        encrypted_phone = crypt.encrypt(new_phone)
        query = "UPDATE Users SET UserPhone=%s WHERE Username=%s;"
        cursor.execute(query, [encrypted_phone, username])
        conn.commit()

        return jsonify({"success": True, "message": "Phone number updated successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@modify_user.route('/user/modify/email', methods=['POST'])
def modify_email():
    data = request.get_json()
    username = data.get('username')
    new_email = data.get('new_email')

    if not username or not new_email:
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = "UPDATE Users SET UserEmail=%s WHERE Username=%s;"
        cursor.execute(query, [new_email, username])
        conn.commit()

        return jsonify({"success": True, "message": "Email updated successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@modify_user.route('/user/modify/shipping-address', methods=['POST'])
def modify_shippingAddress():
    data = request.get_json()
    username = data.get('username')
    new_address = data.get('new_address')
    new_address2 = data.get('new_address2')
    new_city = data.get('new_city')
    new_state = data.get('new_state')
    new_zipCode = data.get('new_zipCode')

    if not username or not new_address or not new_city or not new_state or not new_zipCode:
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        encrypted_address = crypt.encrypt(new_address)
        encrypted_address2 = ""
        if new_address2:
            encrypted_address2 = crypt.encrypt(new_address2)
        encrypted_city = crypt.encrypt(new_city)
        encrypted_state = crypt.encrypt(new_state)
        encrypted_zipCode = crypt.encrypt(new_zipCode)
        query = """UPDATE Users 
                  SET UserAddress=%s, UserSecAddress=%s, UserCity=%s, UserState=%s, UserZipCode=%s 
                  WHERE Username=%s;"""

        cursor.execute(query, [encrypted_address, encrypted_address2, encrypted_city,
                               encrypted_state, encrypted_zipCode, username])
        conn.commit()

        return jsonify({"success": True, "message": "Shipping address updated successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@modify_user.route('/user/modify/bio', methods=['POST'])
def modify_bio():
    data = request.get_json()
    username = data.get('username')
    new_bio = data.get('new_bio')

    if not username or not new_bio:
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = "UPDATE Users SET UserBio=%s WHERE Username=%s;"
        cursor.execute(query, [new_bio, username])
        conn.commit()

        return jsonify({"success": True, "message": "Bio updated successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@modify_user.route('/user/modify/truck-info', methods=['POST'])
def modify_truck_info():
    data = request.get_json()
    username = data.get('username')
    new_truck_info = data.get('new_truck_info')

    if not username or not new_truck_info:
        return jsonify({"success": False, "message": "Missing Argument"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query_user = "SELECT UserID FROM Users WHERE Username=%s;"
        cursor.execute(query_user, [username])
        user_result = cursor.fetchone()
        
        if not user_result:
            return jsonify({"success": False, "message": "User not found"}), 404
            
        user_id = user_result[0]

        query = "UPDATE DriverInfo SET DriverTruckInfo=%s WHERE UserID=%s;"
        cursor.execute(query, [new_truck_info, user_id])
        conn.commit()

        return jsonify({"success": True, "message": "Truck information updated successfully"})

    except Error as e:
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@modify_user.route('/user/upload/pfp', methods=['POST'])
def upload_pfp():
    file = request.files['image']
    username = request.form.get("username")

    if not username:
        return jsonify({'success': False, 'message': 'Missing Argument'})

    query = "SELECT UserPFP FROM Users WHERE Username=%s"
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, [username])
    row = cursor.fetchone()

    response_body = {}

    if row is not None:
        extension = file.filename.split(".")[-1]
        file.filename = f"{str(uuid.uuid4())}.{extension}"

        path = os.path.join(os.getcwd(), "profile_pictures")
        if not os.path.exists(path):
            os.mkdir(path)

        if row['UserPFP']:
            if os.path.exists(os.path.join(path, row['UserPFP'])):
                os.remove(os.path.join(path, row['UserPFP']))

        path = os.path.join(path, file.filename)
        file.save(path)

        query = "UPDATE Users SET UserPFP=%s WHERE Username=%s"
        cursor.execute(query, [file.filename, username])
        conn.commit()

        response_body = {'success': True, 'message': 'Image Uploaded Successfully'}
    else:
        response_body = {"success": False, "message": "Username does not exist"}

    # Close the connection
    conn.close()
    return response_body