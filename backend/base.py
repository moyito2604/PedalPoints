from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
import os
from modules import users, modify_user, sponsor, admin, reports
from flask import request
from urllib.parse import urlparse
import requests
import json
from decimal import Decimal
from mysql.connector import IntegrityError
from datetime import datetime


api = Flask(__name__)
cors = CORS(api)

# Blueprints split api into different files
api.register_blueprint(users.users)
api.register_blueprint(modify_user.modify_user)
api.register_blueprint(sponsor.sponsor)
api.register_blueprint(admin.admin)
api.register_blueprint(reports.reports)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),  
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None), #password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}
print("Database Configuration\n", f"Host: {db_config['host']}\n", f"Port: {db_config['port']}\n", f"User: {db_config['user']}\n", f"Database: {db_config['database']}\n")

@api.route('/about')
def my_profile():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)

    #SQL query
    query = "SELECT * FROM About LIMIT 1;"  # first row for now
    cursor.execute(query)

    rows = cursor.fetchall()

    response_body = {}

    if rows:
        row = rows[0]
        response_body = {
            "Team": str(row["team_number"]).zfill(2),
            "Version": str(row["version_number"]),
            "Release": row["release_date"].strftime('%B %d, %Y'),  # Format date as 'Month Day, Year'
            "Name": row["product_name"],
            "Description": row["product_description"]
        }

    cursor.close()
    conn.close()

    # Return as JSON <- fixed it
    return jsonify(response_body)
@api.route('/sponsor/catalog/input', methods=['POST'])
def receive_input():
    try:
        data = request.json
        if not data:
            raise ValueError("No data received")

        term = data.get('artist', '')
        entity = data.get('type', '')
        genre = data.get('genre', '')
        username = data.get('userId', '')

        if username is None:
            return jsonify({'error': 'No user found. Please log in first.'}), 400

        url = 'https://itunes.apple.com/search'
        params = {'term': term, 'entity': entity, 'limit': 10}
        response = requests.get(url, params=params)
        data = response.json()

        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)

        cursor.execute("SELECT SponsorID FROM SponsorUser WHERE UserID = %s;", (username,))
        row = cursor.fetchone()
        sponsor_id = row['SponsorID'] if row else None

        if genre:
            filtered_results = [item for item in data.get("results", []) if item.get("primaryGenreName") == genre]
        else:
            filtered_results = data.get("results", [])

        filtered_results = [item for item in filtered_results if item.get("collectionExplicitness") != "explicit"]

        if not filtered_results:
            return jsonify({'error': 'No Items Found, Try again with another search parameter'}), 400

        inserted = False
        for item in filtered_results:
            artistName = item.get('artistName')
            artistId = item.get('artistId')
            wrapperType = item.get('wrapperType')
            track_id = item.get('trackId') or item.get('collectionId')
            trackName = item.get('trackName') or item.get('collectionName')
            artworkUrl = item.get('artworkUrl100') or item.get('artworkUrl60') or item.get('artworkUrl30')
            price = Decimal(item.get('trackPrice') or item.get('collectionPrice') or 0.0)

            # Check if product already exists
            cursor.execute("SELECT ProductActive FROM Product WHERE SponsorID = %s AND ProductTrackId = %s;", (sponsor_id, track_id))
            existing_product = cursor.fetchone()

            if existing_product:
                if existing_product['ProductActive'] == 0:
                    # Reactivate the item instead of inserting
                    cursor.execute("UPDATE Product SET ProductActive = 1 WHERE SponsorID = %s AND ProductTrackId = %s;", (sponsor_id, track_id))
                    conn.commit()
                    inserted = True
                    break
                else:
                    continue  # Product already active, skip
            else:
                # Insert new product with ProductActive = 1
                insert_query = """
                    INSERT INTO Product (SponsorID, ProductType, ProductName, ProductTrackId, ProductArtistName, ProductPrice, ProductImage, ProductActive)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """
                insert_data = (sponsor_id, wrapperType, trackName, track_id, artistName, price, artworkUrl, 1)
                cursor.execute(insert_query, insert_data)
                conn.commit()
                inserted = True
                break

        if not inserted:
            return jsonify({"error": f"Duplicate entry: All tracks are already in the catalog."}), 400

        cursor.execute("SELECT * FROM Product WHERE SponsorID = %s AND ProductActive = 1;", (sponsor_id,))
        updated_products = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({"message": "Data received successfully!", "products": updated_products}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": f"Error: {str(e)}"}), 400

@api.route('/sponsors', methods=['GET'])
def get_sponsors():
    user_id = request.args.get("userId")  # Get userId from query parameters
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)

        # SQL query to get sponsor details for the user
        query = """
        SELECT 
            s.SponsorID, 
            s.SponsorCompanyName,
            dr.DriverPoints
        FROM 
            Sponsor s
        JOIN 
            DriverRelation dr ON s.SponsorID = dr.SponsorID
        WHERE 
            dr.UserID = %s
            AND dr.DriverStatus = 2;
        """
        cursor.execute(query, (user_id,))
        sponsors = cursor.fetchall()
        cursor.close()
        conn.close()

        if not sponsors:
            return jsonify({"error": "No sponsors found for this user"}), 404

        return jsonify(sponsors)  # Return actual sponsor data

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {str(err)}"}), 500

@api.route('/sponsor/catalog/products', methods=['GET'])
def get_catalog_sponsor():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        user_id = request.args.get('userId')  # Get userId from request params
        cursor.execute("SELECT * FROM Product WHERE SponsorID = (SELECT SponsorID FROM SponsorUser WHERE UserID = %s) AND ProductActive = 1;", (user_id,))
        updated_products = cursor.fetchall()
        # Closing the cursor and connection
        cursor.close()
        conn.close()

        # Return the products in the response
        return jsonify({"message": "Data received successfully!", "products": updated_products}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": f"Error: {str(e)}"}), 400

@api.route('/catalog/get', methods=['POST', 'DELETE'])
def get_catalog():
    try:
        data = request.json
        user_id = data.get("userId")
        sortBy= data.get("sortBy")
        sponsor_id= data.get("sponsorId")
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        # Connect to database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        # Convert the result into a list of integers
        
        query2 = """SELECT SponsorID, ProductType, ProductName, ProductTrackId, ProductArtistName, ProductPrice, ProductImage FROM Product WHERE SponsorID = %s AND ProductActive = 1"""
            # Execute query with multiple SponsorIDs
        if sortBy == "price_asc":
                query2 += " ORDER BY ProductPrice ASC;"
        elif sortBy == "price_desc":
                query2 += " ORDER BY ProductPrice DESC;"
        elif sortBy == "sponsor":
                query2 += " ORDER BY SponsorID;"
        cursor.execute(query2, (sponsor_id,))  # Must be a tuple

        catalog_items = cursor.fetchall()

        pointQuery = "SELECT SponsorPointValue FROM Sponsor WHERE SponsorID =%s;"
        cursor.execute(pointQuery, (sponsor_id,))
        row = cursor.fetchone()
        pointvalue = row['SponsorPointValue'] if row else None
        for product in catalog_items:
            product['ProductPrice'] = round(float(product['ProductPrice']) / float(pointvalue))
        cursor.close()
        conn.close()

        return jsonify(catalog_items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@api.route('/sponsor/catalog/delete', methods=['POST'])  # Change DELETE to POST
def delete_catalog_item():
    data = request.json
    user_id = data.get('userId')
    track_id = data.get('productTrackId')  # Make sure this matches the frontend key name


    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)

    query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
    cursor.execute(query, (user_id,))

    row = cursor.fetchone()
    sponsor_id = row['SponsorID'] if row else None

    query2 = "UPDATE Product SET ProductActive = 0 WHERE ProductTrackId = %s AND SponsorID = %s;"
    data = (track_id,sponsor_id)
    cursor.execute(query2, data)
    conn.commit()

    deletequery = "DELETE FROM Cart WHERE ProductTrackId = %s AND DriverRelationID IN(SELECT DriverRelationID FROM DriverRelation WHERE SponsorID = %s);"
    data = (track_id,sponsor_id)
    cursor.execute(deletequery, data)
    conn.commit()
    # Perform the SQL delete operation here using user_id and track_id
    cursor.close()
    conn.close()
    return jsonify({'message': 'Item deleted successfully'}), 200


@api.route('/cart/update', methods=['POST'])
def update_cart():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    user_id = request.json.get('userId')
    item = request.json.get('item')
    if not user_id or not item:
        return jsonify({"message": "Missing user ID or item data"}), 400
    sponsor_id = item.get('SponsorID')
    track_id = item.get('ProductTrackId')
    
    
    url = "https://itunes.apple.com/lookup?id="+track_id

    response = requests.request("GET", url)
    data= response.json()
    if 'results' in data and len(data['results']) > 0:
        filtered_results = data['results']
        
        for item in filtered_results:
            artistName = item.get('artistName')
            artistId = item.get('artistId')
            wrapperType = item.get('wrapperType')
            id = item.get('trackId') or item.get('collectionId')
            trackName = item.get('trackName') or item.get('collectionName')
            artworkUrl = item.get('artworkUrl100') or item.get('artworkUrl60') or item.get('artworkUrl30')
            price = Decimal(item.get('trackPrice') or item.get('collectionPrice') or 0)
            
            cursor.execute("SELECT * FROM Product WHERE SponsorID = %s AND ProductTrackId = %s;", (sponsor_id, id))
            existing_product = cursor.fetchone()
            if existing_product:
                db_track_name = existing_product.get('ProductName')
                db_price = Decimal(existing_product.get('ProductPrice', 0))
                db_artwork_url = existing_product.get('ProductImage')
                if db_track_name != trackName or round(db_price) != round(price) or db_artwork_url != artworkUrl:
                    cursor.execute("""
                        UPDATE Product
                        SET ProductName = %s, ProductPrice = %s, ProductImage = %s
                        WHERE SponsorID = %s AND ProductTrackId = %s;
                        """, (trackName, price, artworkUrl, sponsor_id, id))
                    conn.commit()


    query_check="""INSERT INTO Cart (DriverRelationID, ProductTrackId, Quantity)
            VALUES (
                (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2 LIMIT 1),
                %s,
                1
                )
            ON DUPLICATE KEY UPDATE Quantity = Quantity + 1;"""
    cursor.execute(query_check, (user_id,sponsor_id, track_id))
    conn.commit()


    
    return jsonify({"message": "Item added to cart successfully"})

@api.route('/cart/get', methods=['POST'])
def get_cart():
    user_id = request.json.get('userId')
    sponsor_id= request.json.get('sponsorId')
    # Check if user ID is provided
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    try:
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        sponsorquery="SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID= %s AND DriverStatus = 2;"
        cursor.execute(sponsorquery, (user_id,sponsor_id,))
        result = cursor.fetchone()
        if result:
            driver_relation_id = result["DriverRelationID"]  # Extract the single DriverRelationID  
        else:
            driver_relation_id = None
        if driver_relation_id:
            # Query to fetch the user's cart items with price and quantity
            query = """
            SELECT c.ProductTrackId, c.Quantity, p.ProductName, p.ProductImage, 
                p.ProductPrice, p.ProductArtistName
            FROM Cart c
            JOIN Product p ON c.ProductTrackId = p.ProductTrackId
            WHERE c.DriverRelationID = %s and p.SponsorID= %s;
            """    
            cursor.execute(query, (driver_relation_id,sponsor_id,))
            cart_items = cursor.fetchall()
            
            pointQuery = "SELECT SponsorPointValue FROM Sponsor WHERE SponsorID = %s;"
            cursor.execute(pointQuery, (sponsor_id,))
            row = cursor.fetchone()
            pointvalue = row['SponsorPointValue'] if row else None
            for product in cart_items:
                product['ProductPrice'] = round(float(product['ProductPrice']) / float(pointvalue))

        else:
            cart_items = []

        # Initialize total_price to 0 before calculating
        total_price = 0  # This was missing and was likely causing the error
        total_quantity = 0
        # Add total price for each item (quantity * price)
        for item in cart_items:
            item['TotalPrice'] = float(item['ProductPrice']) * item['Quantity']
            total_price += item['TotalPrice']  # Accumulate the total price
            total_quantity += item['Quantity']
        # Query to get the total driver points for the user
        points_query = """
        SELECT DriverPoints AS TotalDriverPoints
        FROM DriverRelation
        WHERE DriverRelationID = %s;
        """
        cursor.execute(points_query, (driver_relation_id,))
        driver_points_result = cursor.fetchone()

        # Get the total driver points (or 0 if no points found)
        total_driver_points = driver_points_result['TotalDriverPoints'] if driver_points_result['TotalDriverPoints'] is not None else 0

        cursor.close()
        conn.close()

        # Return cart items, total price, and total driver points
        return jsonify({
            'cartItems': cart_items,
            'totalPrice': round(total_price),
            'totalQuantity': total_quantity,
            'totalDriverPoints': total_driver_points
        })

    except mysql.connector.Error as err:
        return jsonify({'error': f'Error fetching cart: {err}'}), 500
    
@api.route('/cart/update_quantity', methods=['POST'])
def update_cart_quantity():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    data = request.json
    action = data.get('action')
    product_id = data.get('productId')
    user_id = data.get('userId')
    sponsor_id = data.get("sponsorId")

    if not user_id or not product_id:
        return jsonify({"error": "Missing user ID or product track ID"}), 400

    points_query = "SELECT Quantity FROM Cart WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
    cursor.execute(points_query, (user_id, sponsor_id, product_id))
    quantity = cursor.fetchone()
    val = quantity['Quantity']
    if (val <= 1) & (action == "minus"):
        action = "delete"

    if action == "plus":
        query = "UPDATE Cart SET Quantity = Quantity + 1 WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
    elif action == "minus":
        query = "UPDATE Cart SET Quantity = Quantity - 1 WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
    elif action == "delete":
        query = "DELETE FROM Cart WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
        

    cursor.execute(query, (user_id, sponsor_id, product_id))
    conn.commit()  # Commit the transaction after executing the query
    return jsonify({"message": "Cart updated successfully"}), 200  # Return a success response

@api.route('/checkout', methods=['POST'])
def checkout():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        # Get the data sent from the frontend
        total_points = request.json.get('totalPoints')
        total_amount = request.json.get('totalAmount')
        sponsor_id = request.json.get('sponsorId')
        user_id =  request.json.get('userId')
        sponsorquery="SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID= %s AND DriverStatus = 2;"
        cursor.execute(sponsorquery, (user_id,sponsor_id,))
        result = cursor.fetchone()
        driver_relation_id = result["DriverRelationID"]
        transaction_date = datetime.now()
        cart_query = """INSERT INTO Purchase (DriverRelationID, ProductID, PurchaseQuantity, PurchaseDate)
            SELECT c.DriverRelationID, p.ProductTrackId, c.Quantity, NOW()
            FROM Cart c
            JOIN DriverRelation dr ON c.DriverRelationID = dr.DriverRelationID
            JOIN Product p 
              ON c.ProductTrackId = p.ProductTrackId
             AND dr.SponsorID = p.SponsorID
            WHERE c.DriverRelationID = %s;"""
        cursor.execute(cart_query, (driver_relation_id,))
        conn.commit()

        query = """DELETE FROM Cart WHERE DriverRelationID= %s;"""
        cursor.execute(query, (driver_relation_id,))
        conn.commit()
        transaction_date = datetime.now()

        # Creating the SQL query to insert the transaction
        transaction_query = """
            INSERT INTO Transaction (DriverRelationID, TransactionDate, TransactionChange, TransactionReason)
            VALUES (%s, %s, %s, %s)
        """

        # Executing the query
        cursor.execute(transaction_query, (driver_relation_id, transaction_date, -abs(total_amount), "Driver Purchase"))
        conn.commit()

        notification_query = """
            INSERT INTO Notification (UserID, NotificationType, NotificationDetails, NotificationDate)
            VALUES (%s, %s, %s, %s)
        """
        
        notification_type = f"Order"
        notification_details = f"Your order has been placed!"
        cursor.execute(notification_query, (user_id, notification_type, notification_details, transaction_date))
        conn.commit()
        
        return jsonify({"message": "Checkout data received successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@api.route('/getUserDetails', methods=['POST'])
def get_user_details():    
    data = request.get_json()    
    user_id = data.get("userId")
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    # Connect to the database
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    
    # First query to get the sponsor information
    query = "SELECT SponsorID, DriverPoints FROM DriverRelation WHERE UserID= %s AND DriverStatus = 2;"
    cursor.execute(query, (user_id,))
    results = cursor.fetchall()
    
    if not results:
        return jsonify({"sponsors": []})  # If no results, return empty sponsors list
    
    # Now fetch the company names for each sponsor
    sponsors = []
    for row in results:
        sponsor_id = row['SponsorID']
        points = row['DriverPoints']
        
        # Second query to get the company name for each sponsor
        company_query = "SELECT SponsorCompanyName FROM Sponsor WHERE SponsorID = %s;"
        cursor.execute(company_query, (sponsor_id,))
        company_result = cursor.fetchone()
        
        if company_result:
            company_name = company_result['SponsorCompanyName']
        else:
            company_name = "Unknown Sponsor"
        
        sponsors.append({
            "name": company_name,
            "points": points
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({"sponsors": sponsors})

@api.route('/getOrderDetails', methods=['POST'])
def get_order_details():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    data = request.get_json()
    user_id = data.get("userId")
    #SQL query
    query = """SELECT DriverRelationID 
            FROM DriverRelation 
            WHERE UserID = %s AND DriverStatus = 2;"""  # first row for now
    cursor.execute(query, (user_id,))

    rows = cursor.fetchall()
    driver_relation_ids = [row['DriverRelationID'] for row in rows]
    if not driver_relation_ids:
        return jsonify({"error": "No active DriverRelation found for this user"}), 404

    # Convert list to SQL-friendly format
    format_ids = ','.join(['%s'] * len(driver_relation_ids))  # Use placeholders for parameterized query
    query = f"""
            SELECT 
                t.TransactionDate, 
                t.TransactionChange, 
                t.DriverRelationID, 
                s.SponsorCompanyName,
                (
                    SELECT SUM(PurchaseQuantity)
                    FROM Purchase
                    WHERE DriverRelationID IN ({format_ids})
                      AND PurchaseDate = (
                          SELECT MAX(PurchaseDate)
                          FROM Purchase
                          WHERE DriverRelationID IN ({format_ids})
                      )
                ) AS MostRecentPurchaseQuantity
            FROM Transaction t
            JOIN DriverRelation dr ON t.DriverRelationID = dr.DriverRelationID
            JOIN Sponsor s ON dr.SponsorID = s.SponsorID
            WHERE t.DriverRelationID IN ({format_ids})
            ORDER BY t.TransactionDate DESC
            LIMIT 1;
        """

        # Flatten the list to pass to the query
    params = driver_relation_ids * 3  # We need the list twice for the subqueries
    cursor.execute(query, tuple(params))
    result = cursor.fetchone()

    if result:
        response = {
        "TransactionDate": str(result["TransactionDate"]),  # Convert datetime to string if needed
        "TransactionChange": float(result["TransactionChange"]),
        "DriverRelationID": result["DriverRelationID"],
        "SponsorCompanyName": result["SponsorCompanyName"],
        "MostRecentPurchaseQuantity": int(result["MostRecentPurchaseQuantity"])
        }
    else:
        response = {"message": "No transactions found for the user."}

    cursor.close()
    conn.close()

    # Return as JSON <- fixed it
    return jsonify(response)



@api.route('/sponsor/drivers', methods=['POST'])  # Change GET to POST here
def get_sponsor_drivers():
    data = request.get_json()  # Extract JSON data from request body
    user_id = data.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
        cursor.execute(query, (user_id,))

        row = cursor.fetchone()
        sponsor_id = row['SponsorID'] if row else None

        # SQL query to get drivers associated with the sponsor
        query = """
            SELECT u.Username, u.UserID, d.DriverPoints 
            FROM Users u
            JOIN DriverRelation d ON u.UserID = d.UserID
            WHERE d.SponsorID = %s AND d.DriverStatus = 2 AND u.UserIsActive = 1 ORDER BY UserID;
        """
        cursor.execute(query, (sponsor_id,))
        drivers = cursor.fetchall()
        cursor.close()
        conn.close()

        if not drivers:
            return jsonify({"error": "No drivers found for this sponsor"}), 404

        return jsonify(drivers)  # Return driver data

    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {str(err)}"}), 500

@api.route('/sponsor/catalog/get', methods=['POST', 'DELETE'])
def get_catalog_sponsor_person():
    data = request.get_json()  # Extract JSON data from request body
    user_id = data.get("userId")
    sortBy = data.get("sortBy")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        sponsor_id = row['SponsorID'] if row else None
        
        query2 = """SELECT SponsorID, ProductType, ProductName, ProductTrackId, ProductArtistName, ProductPrice, ProductImage FROM Product WHERE SponsorID = %s AND ProductActive = 1 """
            # Execute query with multiple SponsorIDs
        if sortBy == "price_asc":
                query2 += " ORDER BY ProductPrice ASC;"
        elif sortBy == "price_desc":
                query2 += " ORDER BY ProductPrice DESC;"
        elif sortBy == "sponsor":
                query2 += " ORDER BY SponsorID;"
        cursor.execute(query2, (sponsor_id,))  # Must be a tuple
        catalog_items = cursor.fetchall()

        pointQuery = "SELECT SponsorPointValue FROM Sponsor WHERE SponsorID = %s;"
        cursor.execute(pointQuery, (sponsor_id,))
        row = cursor.fetchone()
        pointvalue = row['SponsorPointValue'] if row else None
        for product in catalog_items:
            product['ProductPrice'] = round(float(product['ProductPrice']) / float(pointvalue))

        # Get catalog items
        cursor.close()
        conn.close()

        return jsonify(catalog_items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@api.route('/sponsor/cart/update', methods=['POST'])
def update_cart_sponsor():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    driver_id = request.json.get('driverId')
    item = request.json.get('item')
    if not driver_id or not item:
        return jsonify({"message": "Missing user ID or item data"}), 400
    sponsor_id = item.get('SponsorID')
    track_id = item.get('ProductTrackId')
    url = "https://itunes.apple.com/lookup?id="+track_id

    response = requests.request("GET", url)
    data= response.json()
    if 'results' in data and len(data['results']) > 0:
        filtered_results = data['results']
        
        for item in filtered_results:
            id = item.get('trackId') or item.get('collectionId')
            trackName = item.get('trackName') or item.get('collectionName')
            artworkUrl = item.get('artworkUrl100') or item.get('artworkUrl60') or item.get('artworkUrl30')
            price = Decimal(item.get('trackPrice') or item.get('collectionPrice') or 0)
            
            cursor.execute("SELECT * FROM Product WHERE SponsorID = %s AND ProductTrackId = %s;", (sponsor_id, id))
            existing_product = cursor.fetchone()
            if existing_product:
                db_track_name = existing_product.get('ProductName')
                db_price = Decimal(existing_product.get('ProductPrice', 0))
                db_artwork_url = existing_product.get('ProductImage')
                if db_track_name != trackName or round(db_price) != round(price) or db_artwork_url != artworkUrl:
                    cursor.execute("""
                        UPDATE Product
                        SET ProductName = %s, ProductPrice = %s, ProductImage = %s
                        WHERE SponsorID = %s AND ProductTrackId = %s;
                        """, (trackName, price, artworkUrl, sponsor_id, id))
                    conn.commit()

    # FIGURE OUT HOW TO CHECK
    query_check="""INSERT INTO Cart (DriverRelationID, ProductTrackId, Quantity)
            VALUES (
                (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2 LIMIT 1),
                %s,
                1
                )
            ON DUPLICATE KEY UPDATE Quantity = Quantity + 1;"""
    cursor.execute(query_check, (driver_id,sponsor_id, track_id))
    conn.commit()    
    return jsonify({"message": "Item added to cart successfully"})
@api.route('/sponsor/cart/get', methods=['POST'])
def get_cart_sponsor():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    data = request.get_json()  # Extract JSON data from request body
    user_id = data.get("userId")
    driver_id = data.get('driverId')
    try:
        
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        sponsor_id = row['SponsorID'] if row else None
        sponsorquery="SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID= %s AND DriverStatus = 2;"
        cursor.execute(sponsorquery, (driver_id,sponsor_id,))
        result = cursor.fetchone()
        

        if result:
            driver_relation_id = result["DriverRelationID"]  # Extract the single DriverRelationID  
        else:
            driver_relation_id = None
        if driver_relation_id:
            # Query to fetch the user's cart items with price and quantity
            query = """
            SELECT c.ProductTrackId, c.Quantity, p.ProductName, p.ProductImage, 
                p.ProductPrice, p.ProductArtistName
            FROM Cart c
            JOIN Product p ON c.ProductTrackId = p.ProductTrackId
            WHERE c.DriverRelationID = %s and p.SponsorID= %s;
            """
            cursor.execute(query, (driver_relation_id,sponsor_id,))
            cart_items = cursor.fetchall()
            pointQuery = "SELECT SponsorPointValue FROM Sponsor WHERE SponsorID = %s;"
            cursor.execute(pointQuery, (sponsor_id,))
            row = cursor.fetchone()
            pointvalue = row['SponsorPointValue'] if row else None
            for product in cart_items:
                product['ProductPrice'] = round(float(product['ProductPrice']) / float(pointvalue))


        else:
            cart_items = []

        # Initialize total_price to 0 before calculating
        total_price = 0  # This was missing and was likely causing the error
        total_quantity = 0
        # Add total price for each item (quantity * price)
        for item in cart_items:
            item['TotalPrice'] = float(item['ProductPrice']) * item['Quantity']
            total_price += item['TotalPrice']  # Accumulate the total price
            total_quantity += item['Quantity']
        # Query to get the total driver points for the user
        points_query = """
        SELECT DriverPoints AS TotalDriverPoints
        FROM DriverRelation
        WHERE DriverRelationID = %s;
        """
        cursor.execute(points_query, (driver_relation_id,))
        driver_points_result = cursor.fetchone()
         # Debugging output

        # Ensure driver_points_result is not None before accessing it
        total_driver_points = driver_points_result['TotalDriverPoints'] if driver_points_result and 'TotalDriverPoints' in driver_points_result else 0


        cursor.close()
        conn.close()

        # Return cart items, total price, and total driver points
        return jsonify({
            'cartItems': cart_items,
            'totalPrice': round(total_price),
            'totalQuantity': total_quantity,
            'totalDriverPoints': total_driver_points
        })

    except mysql.connector.Error as err:
        return jsonify({'error': f'Error fetching cart: {err}'}), 500
@api.route('/sponsor/cart/update_quantity', methods=['POST'])
def update_cart_quantity_sponsor():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    data = request.json
    action = data.get('action')
    product_id = data.get('productId')
    user_id = data.get('userId')
    driver_id=data.get('driverId')
    query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
    cursor.execute(query, (user_id,))
    row = cursor.fetchone()
    sponsor_id = row['SponsorID'] if row else None

    if not user_id or not product_id:
        return jsonify({"error": "Missing user ID or product track ID"}), 400

    points_query = "SELECT Quantity FROM Cart WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
    cursor.execute(points_query, (driver_id, sponsor_id, product_id))
    quantity = cursor.fetchone()
    val = quantity['Quantity']
    if (val <= 1) & (action == "minus"):
        action = "delete"

    if action == "plus":
        query = "UPDATE Cart SET Quantity = Quantity + 1 WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
    elif action == "minus":
        query = "UPDATE Cart SET Quantity = Quantity - 1 WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2 ) AND ProductTrackId = %s;"
    elif action == "delete":
        query = "DELETE FROM Cart WHERE DriverRelationID = (SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID = %s AND DriverStatus = 2) AND ProductTrackId = %s;"
        
    cursor.execute(query, (driver_id, sponsor_id, product_id))
    conn.commit()  # Commit the transaction after executing the query
    return jsonify({"message": "Cart updated successfully"}), 200  # Return a success response
@api.route('/sponsor/checkout', methods=['POST'])
def checkout_sponsor():
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    try:
        # Get the data sent from the frontend
        total_points = request.json.get('totalPoints')
        total_amount = request.json.get('totalAmount')
        user_id =  request.json.get('userId')
        driver_id = request.json.get('driverId')
        query = "SELECT SponsorID FROM SponsorUser WHERE UserID = %s;"
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        sponsor_id = row['SponsorID'] if row else None
        sponsorquery="SELECT DriverRelationID FROM DriverRelation WHERE UserID = %s AND SponsorID= %s AND DriverStatus = 2;"
        cursor.execute(sponsorquery, (driver_id,sponsor_id,))
        result = cursor.fetchone()
        driver_relation_id = result["DriverRelationID"]
        transaction_date = datetime.now()
        cart_query = """INSERT INTO Purchase (DriverRelationID, ProductID, PurchaseQuantity, PurchaseDate)
            SELECT c.DriverRelationID, p.ProductTrackId, c.Quantity, NOW()
            FROM Cart c
            JOIN DriverRelation dr ON c.DriverRelationID = dr.DriverRelationID
            JOIN Product p 
              ON c.ProductTrackId = p.ProductTrackId
             AND dr.SponsorID = p.SponsorID
            WHERE c.DriverRelationID = %s;"""
        cursor.execute(cart_query, (driver_relation_id,))
        conn.commit()


        query = """DELETE FROM Cart WHERE DriverRelationID= %s;"""
        cursor.execute(query, (driver_relation_id,))
        conn.commit()
        # Creating the SQL query to insert the transaction
        transaction_query = """
            INSERT INTO Transaction (DriverRelationID, TransactionDate, TransactionChange, TransactionReason)
            VALUES (%s, %s, %s, %s)
        """

        # Executing the query
        cursor.execute(transaction_query, (driver_relation_id, transaction_date, -abs(total_amount), "Sponsor Purchase for Driver"))
        conn.commit()
        
        return jsonify({"message": "Checkout data received successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
