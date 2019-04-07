# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import fcntl
import ipaddress
import socket
import struct

from packet import Packet


class Sender:
    def __init__(self, interface: str):
        self.sock = socket.socket(type=socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self.sock.setsockopt(
                socket.SOL_SOCKET, socket.SO_BINDTODEVICE,
                interface.encode('utf-8'))
        self.sock.bind(('', 67))

        # Figure out our local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        packed = socket.inet_ntoa(fcntl.ioctl(
            s.fileno(),
            0x8915,  # SIOCGIFADDR
            struct.pack('256s', interface.encode('utf-8'))
        )[20:24])
        self.ip = ipaddress.IPv4Address(packed)

    def sendPacket(self, packet, addr='255.255.255.255'):
        data = packet.toBytes()
        self.sock.sendto(data, (addr, 68))

    def getIP(self) -> ipaddress.IPv4Address:
        return self.ip
