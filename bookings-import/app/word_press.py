# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import json
import requests
from absl import flags

from booking import Booking


FLAGS = flags.FLAGS

flags.DEFINE_string('wp_url', '', 'Base URL of admin-ajax.php WordPress endpoint')
flags.DEFINE_string('wp_auth_token', '',
        'Auth token used to read bookings from WordPress')

# Flags
remapping = {
    'houdini2': 'Houdini',
    'gefaengnis-neu': 'Gefaengnis',
    'gefaengnis': 'Gefaengnis',
    'test': 'Bibliothek',
    'labor': 'Labor',
}

ignore = ['']


class WordPress:
    def __init__(self):
        self.base_auth = FLAGS.wp_url + '&auth_token=' + FLAGS.wp_auth_token

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
