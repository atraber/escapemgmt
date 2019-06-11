#!/usr/bin/env python3
import json
import requests
import yaml

# Flags
remapping = {
    'houdini2': 'Houdini',
    'gefaengnis-neu': 'Gefaengnis',
    'gefaengnis': 'Gefaengnis',
    'test': 'Bibliothek',
    'labor': 'Labor',
}

ignore = ['']


config = yaml.load(open('config.yaml').read(), Loader=yaml.SafeLoader)
backend_service = config['backend_service']
base = config['base']
auth_token = config['auth_token']


class Booking:
    def __init__(self, id, first_name, name, room_id, slot_from, slot_to):
        self.id = id
        self.first_name = first_name
        self.name = name
        self.room_id = room_id
        self.slot_from = int(slot_from)
        self.slot_to = int(slot_to)

    def serialize(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'name': self.name,
            'room_id': self.room_id,
            'slot_from': self.slot_from,
            'slot_to': self.slot_to,
        }

    @staticmethod
    def deserialize(obj):
        if 'room' in obj:
            room_id = obj['room']['id']
        else:
            room_id = None

        return Booking(
            id=obj['id'],
            first_name=obj['first_name'],
            name=obj['name'],
            room_id=room_id,
            slot_from=obj['slot_from'],
            slot_to=obj['slot_to'],
        )

    def __eq__(lhs, rhs):
        return lhs.id == rhs.id and \
                lhs.first_name == rhs.first_name and \
                lhs.name == rhs.name and \
                lhs.room_id == rhs.room_id and \
                lhs.slot_from == rhs.slot_from and \
                lhs.slot_to == rhs.slot_to

    def __repr__(self):
        return ''.join([
            'Booking id: {};'.format(self.id),
            ' name: {}; first_name: {};'.format(self.name, self.first_name),
            ' room_id: {};'.format(self.room_id),
            ' slot_from: {}; slot_to: {}'.format(self.slot_from, self.slot_to)
        ])


class WordPress:
    def __init__(self, base, auth_token):
        self.base_auth = base + '&auth_token=' + auth_token

    def getExternalBookings(self, rooms):
        response = requests.get(self.base_auth + '&operation=get_reservations')
        if response.status_code != 200:
            raise Exception("Response was not 200")
        body = response.text
        body_json = json.loads(body)
        return self.parseResponse(body_json['response'], rooms)

    def parseResponse(self, obj, rooms):
        bookings = []
        for r in obj:
            if r['type'] != 'reservation':
                print('Unknown type {}'.format(r['type']))
                continue

            room_name = r['service']['id']
            if room_name in remapping.keys():
                room_name = remapping[room_name]

            if room_name in ignore:
                continue

            if room_name in rooms.keys():
                room_id = rooms[room_name]
            else:
                room_id = None

            id = r['id']
            slot_from = r['datetime']['start']
            slot_to = r['datetime']['end']

            first_name = ''
            name = ''
            for field in r['formFields']:
                if field['name'] == 'first_name':
                    first_name = field['value']
                elif field['name'] == 'second_name':
                    name = field['value']

            booking = Booking(id, first_name=first_name, name=name,
                    room_id=room_id, slot_from=slot_from, slot_to=slot_to)
            bookings.append(booking)
        return bookings


class Backend:
    def __init__(self, backend_service: str):
        self.backend_service = backend_service

    def getRooms(self):
        response = requests.get(self.backend_service + 'rooms')
        if response.status_code != 200:
            raise Exception("Response was not 200")
        resp = json.loads(response.text)
        rooms = {}
        for room in resp:
            rooms[room['name']] = room['id']
        return rooms

    def getImportedBookings(self):
        response = requests.get(self.backend_service + 'bookings')
        if response.status_code != 200:
            raise Exception("Response was not 200")
        body = response.text
        resp = json.loads(response.text)
        bookings = []
        for b in resp:
            bookings.append(Booking.deserialize(b))
        return bookings

    def addBooking(self, booking: Booking):
        response = requests.post(self.backend_service + 'booking', json=booking.serialize())

    def updateBooking(self, booking: Booking):
        response = requests.post(
                self.backend_service + 'bookings/{}'.format(booking.id),
                json=booking.serialize())


def compareBookings(imported, external):
    added = []
    removed = []
    changed = []

    imported_index = {}
    external_index = {}

    # Build indices
    for booking in imported:
        imported_index[booking.id] = booking

    for booking in external:
        external_index[booking.id] = booking

    # Add new bookings
    for booking in external:
        if not booking.id in imported_index:
            added.append(booking)

    # Remove old bookings
    for booking in imported:
        if not booking.id in external_index:
            removed.append(booking)

    # Look for changes
    for booking in external:
        if booking.id in imported_index:
            imported_booking = imported_index[booking.id]
            if booking != imported_booking:
                changed.append(booking)

    return added, removed, changed

backend = Backend(backend_service)
word_press = WordPress(base, auth_token)

imported_bookings = backend.getImportedBookings()
rooms = backend.getRooms()
external_bookings = word_press.getExternalBookings(rooms)

added, removed, changed = compareBookings(imported_bookings, external_bookings)

for booking in added:
    print('Adding {}'.format(booking))
    backend.addBooking(booking)

for booking in removed:
    print('Would remove {}'.format(booking))

for booking in changed:
    print('Updating {}'.format(booking))
    backend.updateBooking(booking)
