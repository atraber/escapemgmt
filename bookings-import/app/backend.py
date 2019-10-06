# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import requests
from absl import flags

from booking import Booking, Room


FLAGS = flags.FLAGS

flags.DEFINE_string('backend_service', 'http://localhost:5000/',
        'Base URL of backend service')


class Backend:
    def __init__(self):
        self.backend_service = FLAGS.backend_service

    def getRooms(self):
        response = requests.get(self.backend_service + '/rooms')
        if response.status_code != 200:
            raise Exception("Response was not 200")
        resp = json.loads(response.text)
        rooms = []
        for obj in resp:
            rooms.append(Room.deserialize(obj))

        tags = {}
        for room in rooms:
            for tag in room.tags:
                tags[tag] = room.id
        return tags

    def getImportedBookings(self):
        response = requests.get(self.backend_service + '/bookings')
        if response.status_code != 200:
            raise Exception("Response was not 200")
        body = response.text
        resp = json.loads(response.text)
        bookings = []
        for b in resp:
            bookings.append(Booking.deserialize(b))
        return bookings

    def addBooking(self, booking: Booking):
        response = requests.post(self.backend_service + '/booking', json=booking.serialize())

    def updateBooking(self, booking: Booking):
        response = requests.post(
                self.backend_service + '/bookings/{}'.format(booking.id),
                json=booking.serialize())
