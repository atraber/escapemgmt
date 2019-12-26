load("@rules_python//python:defs.bzl", "py_binary")
load("@py_deps//:requirements.bzl", "requirement")

package(default_visibility = ["//visibility:public"])

py_binary(
    name = "main",
    srcs = [
        "__init__.py",
        "app.py",
        "bookings.py",
        "config.py",
        "devices.py",
        "files.py",
        "initdb.py",
        "logger.py",
        "main.py",
        "models.py",
        "presets.py",
        "pubsub.py",
        "rooms.py",
        "streams.py",
        "streamviews.py",
    ],
    deps = [
        requirement("alembic"),
        requirement("PyMySQL"),
        requirement("certifi"),
        requirement("quart"),
        requirement("hypercorn"),
        requirement("toml"),
        requirement("h2"),
        requirement("hyperframe"),
        requirement("h11"),
        requirement("typing_extensions"),
        requirement("hpack"),
        requirement("wsproto"),
        requirement("multidict"),
        requirement("aiofiles"),
        requirement("blinker"),
        requirement("sortedcontainers"),
        requirement("quart_cors"),
        requirement("minio"),
        requirement("pulsar-client"),
        requirement("fastavro"),
        requirement("sqlalchemy"),
        "//app/quart_sqlalchemy",
    ],
)

filegroup(
    name = "main.zip",
    srcs = [":main"],
    output_group = "python_zip_file",
)

py_binary(
    name = "hypercorn_bin",
    srcs = [
        "hypercorn_bin.py",
    ],
    deps = [
        ":main",
    ],
)

filegroup(
    name = "hypercorn.zip",
    srcs = [":hypercorn_bin"],
    output_group = "python_zip_file",
)

py_test(
    name = "devices_test",
    srcs = ["devices_test.py"],
    deps = [":main"],
)

py_test(
    name = "main_test",
    srcs = ["main_test.py"],
    deps = [":main"],
)

py_test(
    name = "presets_test",
    srcs = ["presets_test.py"],
    deps = [":main"],
)

py_test(
    name = "rooms_test",
    srcs = ["rooms_test.py"],
    deps = [":main"],
)

py_test(
    name = "streams_test",
    srcs = ["streams_test.py"],
    deps = [":main"],
)

py_test(
    name = "streamviews_test",
    srcs = ["streamviews_test.py"],
    deps = [":main"],
)
