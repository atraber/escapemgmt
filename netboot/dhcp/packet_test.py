# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
from packet import options, Packet


def testOptions() -> None:
    assert options[18][0] == 'extensions_path', options[18][0]
    assert options[25][0] == 'path_mtu_plateau_table', options[25][0]
    assert options[33][0] == 'static_route', options[33][0]
    assert options[50][0] == 'requested_ip_address', options[50][0]
    assert options[64][0] == 'network_information_service_domain', options[64][0]
    assert options[76][0] == 'stda_server', options[76][0]


def testPacketParse() -> None:
    onwire = bytes.fromhex('ffffffffffffb827eb227f1308004500014800004000ff117aa500000000ffffffff004400430134000001010600eb22a3bc0000000000000000000000000000000000000000b827eb227f130000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000063825363350101390202405d0200165e030100003c0c552d426f6f742e61726d763837050103060c11ff00000000000000000000000000000000000000000000')

    p = Packet.parse(onwire[42:])
    assert p.message_type == 1
    assert p.hardware_type == 1
    assert p.hardware_address_length == 6
    assert p.hops == 0
    assert p.transaction_id == 0xeb22a3bc
    assert p.seconds_elapsed == 0
    assert p.bootp_flags == 0
    assert p.client_ip_address == '0.0.0.0'
    assert p.your_ip_address == '0.0.0.0'
    assert p.next_server_ip_address == '0.0.0.0'
    assert p.relay_agent_ip_address == '0.0.0.0'
    assert p.dhcp_message_type == 'DHCPDISCOVER'
