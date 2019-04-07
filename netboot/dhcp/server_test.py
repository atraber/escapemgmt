# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import ipaddress
import pytest
from pool import Pool
from packet import Packet
from server import createOffer


def getMacFromNr(n: int) -> str:
    assert n < 2**48
    blocks = []
    for i in range(6):
        x = n & 0xFF
        n = n >> 8
        blocks.append('{:02x}'.format(x))
    return ':'.join(blocks)


def testCreateOffer() -> None:
    onwire_disocvery = bytes.fromhex('ffffffffffffb827eb227f1308004500014800004000ff117aa500000000ffffffff004400430134000001010600eb22a3bc0000000000000000000000000000000000000000b827eb227f130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000063825363350101390202405d0200165e030100003c0c552d426f6f742e61726d763837050103060c11ff00000000000000000000000000000000000000000000')
    packet_discovery = Packet.parse(onwire_disocvery[42:])
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.100')

    response = createOffer(packet_discovery, pool)

    def _check_asserts(p: Packet):
        assert p.message_type == 2
        assert p.hardware_type == 1
        assert p.hardware_address_length == 6
        assert p.hops == 0
        assert p.transaction_id == 0xeb22a3bc
        assert p.seconds_elapsed == 0
        assert p.bootp_flags == 0
        assert p.client_ip_address == '0.0.0.0'
        assert p.your_ip_address == '192.168.0.100'
        # TODO
        assert p.next_server_ip_address == '10.80.44.57'
        assert p.relay_agent_ip_address == '0.0.0.0'
        assert p.dhcp_message_type == 'DHCPOFFER'
        assert p.router == ['10.80.44.57']
        assert p.subnet_mask == str(pool.getNetwork().netmask)
        assert p.domain_name_server == ['8.8.8.8', '8.8.4.4']
    _check_asserts(response)

    response_reparsed = Packet.parse(response.toBytes())
    _check_asserts(response_reparsed)
