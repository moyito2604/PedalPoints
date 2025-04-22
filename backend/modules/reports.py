from flask import Blueprint, jsonify, request, send_file
from io import StringIO, BytesIO
import csv
import mysql.connector
import os

reports = Blueprint("reports", __name__)

db_config = {
    "host": os.environ.get("MYSQL_HOST", None),
    "port": os.environ.get("MYSQL_PORT", 3306),
    "user": os.environ.get("MYSQL_USER", None),
    "password": os.environ.get("MYSQL_PASSWORD", None),  # password from portainer.io
    "database": os.environ.get("MYSQL_DATABASE", None)
}


@reports.route('/reports/login', methods=['GET'])
def login_report():
    query = "SELECT * FROM AuditLog WHERE AuditType LIKE '%Login'"
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query)
    login = cursor.fetchall()
    return login


@reports.route('/reports/login/<usertype>', methods=['GET'])
def login_user_report(usertype):
    if usertype.lower() == "driver":
        query = "SELECT * FROM AuditLog WHERE AuditType LIKE '%Login' AND AuditType LIKE '%Driver%'"
    elif usertype.lower() == "sponsor":
        query = "SELECT * FROM AuditLog WHERE AuditType LIKE '%Login' AND AuditType LIKE '%Sponsor%'"
    elif usertype.lower() == "admin":
        query = "SELECT * FROM AuditLog WHERE AuditType LIKE '%Login' AND AuditType LIKE '%Admin%'"
    else:
        return jsonify({"success": False, "message": "Invalid UserType"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query)
    login = cursor.fetchall()
    return login


@reports.route('/reports/login/sponsor/<sponsorid>', methods=['GET'])
def login_sponsor_report(sponsorid):
    query = ("SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails FROM "
             "(SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog "
             "JOIN Users USING (UserID) JOIN DriverRelation USING (UserID) JOIN Sponsor USING (SponsorID) WHERE DriverStatus = 2 UNION ALL "
             "SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog JOIN Users USING (UserID) "
             "JOIN SponsorUser USING (UserID) JOIN Sponsor USING (SponsorID) WHERE AuditType LIKE '%Login') as Drivers "
             "WHERE AuditType LIKE '%Login' AND SponsorID = %s;")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query, [sponsorid])
    login = cursor.fetchall()
    return login

def login_sponsor_report_func(sponsorid, usertype=None):
    query = ("SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails FROM "
             "(SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog "
             "JOIN Users USING (UserID) JOIN DriverRelation USING (UserID) JOIN Sponsor USING (SponsorID) WHERE DriverStatus = 2 UNION ALL "
             "SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog JOIN Users USING (UserID) "
             "JOIN SponsorUser USING (UserID) JOIN Sponsor USING (SponsorID) WHERE AuditType LIKE '%Login') as Drivers "
             "WHERE AuditType LIKE '%Login' AND SponsorID = %s;")
    if usertype == "sponsor":
        query = ("SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails FROM "
                 "(SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog JOIN Users USING (UserID) "
                 "JOIN SponsorUser USING (UserID) JOIN Sponsor USING (SponsorID) WHERE AuditType LIKE '%Login') as Drivers "
                 "WHERE AuditType LIKE '%Login' AND SponsorID = %s;")
    elif usertype == "driver":
        query = ("SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails FROM "
                 "(SELECT AuditLogID, AuditLogDate, UserID, AuditType, AuditDetails, SponsorID FROM AuditLog "
                 "JOIN Users USING (UserID) JOIN DriverRelation USING (UserID) JOIN Sponsor USING (SponsorID) WHERE DriverStatus = 2) as Drivers "
                 "WHERE AuditType LIKE '%Login' AND SponsorID = %s;")

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query, [sponsorid])
    login = cursor.fetchall()
    return login


# Can do global points for a Sponsor Globally or for a specific user
@reports.route('/reports/points', methods=['POST'])
def points_report():
    data = request.get_json()
    userid = data.get("UserID")
    sponsorid = data.get("SponsorID")

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)

    if sponsorid and userid:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID) "
                 "WHERE SponsorID = %s AND UserID = %s")
        cursor.execute(query, [sponsorid, userid])
    elif sponsorid:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID) "
                 "WHERE SponsorID = %s")
        cursor.execute(query, [sponsorid])
    else:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID)")
        cursor.execute(query)

    points = cursor.fetchall()
    return points


def points_report_func(sponsorid='', userid=''):
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)

    if sponsorid and userid:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID) "
                 "WHERE SponsorID = %s AND UserID = %s")
        cursor.execute(query, [sponsorid, userid])
    elif sponsorid:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID) "
                 "WHERE SponsorID = %s")
        cursor.execute(query, [sponsorid])
    else:
        query = ("SELECT UserID, UserFName, UserLName, TransactionDate, TransactionChange, TransactionReason "
                 "FROM Transaction JOIN DriverRelation USING (DriverRelationID) JOIN Users USING (UserID)")
        cursor.execute(query)

    points = cursor.fetchall()
    return points


# Driver Applications Report
@reports.route('/reports/applications/<sponsorid>', methods=['GET'])
def driver_applications_report(sponsorid):
    query = (
        "SELECT DriverRelationID, UserID, UserFName, UserLName, Username, DriverReason, DriverStatus, SponsorID, SponsorCompanyName, SponsorReason "
        "FROM DriverRelation JOIN Users USING (UserID) JOIN Sponsor USING (SponsorID)"
        "WHERE SponsorID=%s")

    if str(sponsorid).isalpha():
        return jsonify({"success": False, "message": "SponsorID must be a number"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query, [sponsorid])
    login = cursor.fetchall()
    return login


@reports.route('/reports/applications/all', methods=['GET'])
def all_driver_applications_report():
    query = (
        "SELECT DriverRelationID, UserID, UserFName, UserLName, Username, DriverReason, DriverStatus, d.SponsorID, SponsorCompanyName, SponsorReason "
        "FROM DriverRelation d JOIN Users USING (UserID) JOIN Sponsor s ON d.SponsorID = s.SponsorID")

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query)
    applications = cursor.fetchall()
    return applications

@reports.route('/reports/commission/all')
def all_commissions_report():
    query = "SELECT * FROM Commission"
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query)
    applications = cursor.fetchall()
    return applications

@reports.route('/reports/commission/<sponsorid>')
def sponsor_commissions_report(sponsorid):
    query = "SELECT * FROM Commission WHERE SponsorID = %s"
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True, buffered=True)
    cursor.execute(query, [sponsorid])
    login = cursor.fetchall()
    return login

@reports.route('/reports/download/<reportname>', methods=['POST', 'GET'])
def download_report(reportname):
    if reportname == "login-report":
        records = login_report()

    elif reportname == "login-user-report":
        data = request.get_json()
        usertype = data.get("usertype")
        if not usertype:
            return jsonify({"success": False, "message": "Missing Argument usertype"}), 400
        records = login_user_report(usertype)

    elif reportname == "login-sponsor-report":
        data = request.get_json()
        sponsorid = data.get("SponsorID")
        usertype = data.get("usertype")
        if not sponsorid:
            return jsonify({"success": False, "message": "Missing Argument sponsorid"}), 400
        records = login_sponsor_report_func(sponsorid, usertype)

    elif reportname == "points-report":
        data = request.get_json()
        userid = data.get("UserID")
        sponsorid = data.get("SponsorID")
        records = points_report_func(sponsorid, userid)

    elif reportname == "driver-app-report":
        data = request.get_json()
        sponsorid = data.get("SponsorID")
        if not sponsorid:
            return jsonify({"success": False, "message": "Missing Argument sponsorid"}), 400
        records = driver_applications_report(sponsorid)

    elif reportname == "all-driver-app-report":
        records = all_driver_applications_report()

    elif reportname == "all-commissions-report":
        records = all_commissions_report()

    elif reportname == "sponsor-commissions-report":
        data = request.get_json()
        sponsorid = data.get("SponsorID")
        if not sponsorid:
            return jsonify({"success": False, "message": "Missing Argument sponsorid"}), 400
        records = sponsor_commissions_report(sponsorid)

    else:
        return jsonify({"success": False, "message": "Invalid Report Name"}), 400

    file = BytesIO()
    csv_file = StringIO()
    writer = csv.writer(csv_file)

    if records:
        writer.writerow(records[0].keys())
        for row in records:
            writer.writerow(row.values())

    file.write(csv_file.getvalue().encode())
    file.seek(0)
    return send_file(file, download_name=f"{reportname}.csv", as_attachment=True)