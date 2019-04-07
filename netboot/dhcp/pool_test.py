# Copyright 2019 Andreas Traber
# Licensed under MIT (https://github.com/atraber/escapemgmt/LICENSE)
import ipaddress
import pytest
from pool import Pool


def getMacFromNr(n: int) -> str:
    assert n < 2**48
    blocks = []
    for i in range(6):
        x = n & 0xFF
        n = n >> 8
        blocks.append('{:02x}'.format(x))
    return ':'.join(blocks)


def testPoolCreate() -> None:
    Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.110')
    Pool('192.168.0.0/24', '192.168.0.1', '192.168.0.254')
    Pool('192.168.0.0/24', '192.168.0.1', '192.168.0.1')


def testPoolCreate_xfail() -> None:
    with pytest.raises(AssertionError):
        Pool('192.168.0.0/24', '1.1.0.0', '192.168.0.5')

    with pytest.raises(AssertionError):
        Pool('192.168.0.0/24', '192.168.0.1', '1.168.0.5')

    with pytest.raises(AssertionError):
        Pool('1.1.0.0/24', '192.168.0.1', '192.168.0.254')

    with pytest.raises(AssertionError):
        Pool('192.168.0.0/24', '192.168.0.2', '192.168.0.1')


def testGetUnused() -> None:
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.109')
    for i in range(10):
        pool.getUnused(getMacFromNr(i))


def testGetUnused_xfail() -> None:
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.109')
    for i in range(10):
        pool.getUnused(getMacFromNr(i))

    with pytest.raises(KeyError):
        pool.getUnused(getMacFromNr(200))

def testRenew() -> None:
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.109')
    addrs = []
    for i in range(10):
        addrs.append(pool.getUnused(getMacFromNr(i)))

    for i in range(len(addrs)):
        assert pool.renew(addrs[i], getMacFromNr(i))

def testRenew_xfail() -> None:
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.109')
    addrs = []
    for i in range(10):
        addrs.append(pool.getUnused(getMacFromNr(i)))

    for i in range(len(addrs)):
        assert not pool.renew(addrs[i], getMacFromNr(i + 1))

def testGetNetwork() -> None:
    pool = Pool('192.168.0.0/24', '192.168.0.100', '192.168.0.109')
    assert pool.getNetwork() == ipaddress.IPv4Network('192.168.0.0/24')
