# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from datetime import datetime
from quart import abort, Blueprint, request, jsonify

from app import db
from app.models import Booking, Room


bp = Blueprint('booking', __name__)


@bp.route('/bookings', methods = ['GET'])
async def apiBookings():
    bookings = db.session.query(Booking).all()
    return jsonify([s.serialize() for s in bookings])

@bp.route('/booking', methods = ['POST'])
async def apiBookingAdd():
    if request.headers['Content-Type'] == 'application/json':
        json = await request.json
        db_room = db.session.query(Room).filter_by(id=json['room_id']).first()
        booking = Booking(
            id=json['id'],
            first_name=json['first_name'],
            name=json['name'],
            room=db_room,
            slot_from=json['slot_from'],
            slot_to=json['slot_to'],
        )
        db.session.add(booking)
        db.session.commit()
        return jsonify(booking.serialize())
    abort(400)

@bp.route('/bookings/<int:bookingid>', methods = ['POST'])
async def apiBookingUpdate(bookingid: int):
    if request.method == 'POST':
        if request.headers['Content-Type'] == 'application/json':
            data_json = await request.json
            db_room = db.session.query(Room).filter_by(id=data_json['room_id']).first()
            db_booking = db.session.query(Booking).filter_by(id=data_json['id']).first()
            db_booking.first_name = data_json['first_name']
            db_booking.name = data_json['name']
            db_booking.room = db_room
            db_booking.slot_from = data_json['slot_from']
            db_booking.slot_to = data_json['slot_to']
            db.session.commit()
            return jsonify(db_booking.serialize())
    abort(400)
