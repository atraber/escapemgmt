# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
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
