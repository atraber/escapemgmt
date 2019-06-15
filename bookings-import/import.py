#!/usr/bin/env python3
# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import datetime
from absl import app
from absl import flags

from backend import Backend
from booking import Booking
from word_press import WordPress


FLAGS = flags.FLAGS

flags.DEFINE_boolean('synth', False, 'Generate fake data instead of importing (DEBUG)')


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


def generateBookings(rooms):
    bookings = []
    now = datetime.datetime.now().timestamp()
    for i in rooms.values():
        for j in range(3):
            bookings.append(Booking(
                    id=i * len(rooms) + j,
                    first_name='F{}{}'.format(i, j),
                    name='N{}{}'.format(i, j),
                    room_id=i,
                    slot_from=now - j * 60 * 60 - 60 * 30,
                    slot_to=now - j * 60 * 60
            ))
    return bookings


def main(argv):
    backend = Backend()
    rooms = backend.getRooms()

    if FLAGS.synth:
        added = generateBookings(rooms)
        removed = []
        changed = []
    else:
        word_press = WordPress()

        imported_bookings = backend.getImportedBookings()
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


if __name__ == '__main__':
    app.run(main)
