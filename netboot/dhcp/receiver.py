import ctypes
import socket
import struct

from packet import Packet

# Based on https://github.com/BensonHsu/DHCP-Sniffer/blob/master/dhcp_sniffer.py
class BPF:
    def __init__(self):
        self.SO_ATTACH_FILTER = 26

        # instruction classes
        self.BPF_LD  = 0x00
        self.BPF_JMP = 0x05
        self.BPF_RET = 0x06

        # ld/ldx fields
        self.BPF_W   = 0x00    # word(4 byte)
        self.BPF_H   = 0x08    # helf word(2 byte)
        self.BPF_B   = 0x10    # byte(1 byte)
        self.BPF_ABS = 0x20    # absolute address

        # alu/jmp fields
        self.BPF_JEQ = 0x10
        self.BPF_K   = 0x00

    def fillSockFilter(self, code, jt, jf, k):
        return struct.pack('HBBI', code, jt, jf, k)

    def statement(self, code, k):
        return self.fillSockFilter(code, 0, 0, k)

    def jump(self, code, jt, jf, k):
        return self.fillSockFilter(code, jt, jf, k)


class DHCPBPF(BPF):
    def __init__(self):
        super(DHCPBPF, self).__init__()

    def setDHCPFilter(self, sock):
        command_list = [
            # filter IPv4
            self.statement(self.BPF_LD | self.BPF_ABS | self.BPF_H, 12),
            self.jump(self.BPF_JMP | self.BPF_JEQ | self.BPF_K, 0, 5, 0x0800),

            # filter UDP
            self.statement(self.BPF_LD | self.BPF_ABS | self.BPF_B, 23),
            self.jump(self.BPF_JMP | self.BPF_JEQ | self.BPF_K, 0, 3, 0x11),

            # filter destination port 67
            self.statement(self.BPF_LD | self.BPF_ABS | self.BPF_H, 36),
            self.jump(self.BPF_JMP | self.BPF_JEQ | self.BPF_K, 0, 1, 67),

            # return
            self.statement(self.BPF_RET | self.BPF_K, 0xffffffff),  # pass
            self.statement(self.BPF_RET | self.BPF_K, 0x00000000),  # reject
        ]
        commands = b''.join(command_list)
        buffers = ctypes.create_string_buffer(commands)
        fprog = struct.pack('HL', len(command_list), ctypes.addressof(buffers))
        sock.setsockopt(socket.SOL_SOCKET, self.SO_ATTACH_FILTER, fprog)


class Receiver:
    def __init__(self, interface: str):
        # bind raw_socket
        self.sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, 0x0800)

        # use BPF to filter DHCP packet
        DHCPBPF().setDHCPFilter(self.sock)

        self.sock.setsockopt(
                socket.SOL_SOCKET, socket.SO_BINDTODEVICE,
                interface.encode('utf-8'))
        self.sock.bind((interface, 0x0800))

    def waitForPacket(self):
        p, addr = self.sock.recvfrom(4096)
        return Packet.parse(p[42:], addr)
