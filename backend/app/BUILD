load("@rules_python//python:defs.bzl", "py_binary")
load("@py_deps//:requirements.bzl", "all_requirements", "requirement")

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
        requirement("PyMySQL"),
        requirement("aiofiles"),
        requirement("alembic"),
        requirement("blinker"),
        requirement("certifi"),
        requirement("click"),
        requirement("fastavro"),
        requirement("h11"),
        requirement("h2"),
        requirement("hpack"),
        requirement("hypercorn"),
        requirement("hyperframe"),
        requirement("itsdangerous"),
        requirement("jinja2"),
        requirement("mako"),
        requirement("minio"),
        requirement("multidict"),
        requirement("pulsar-client"),
        requirement("py-dateutil"),
        requirement("python-dateutil"),
        requirement("pytz"),
        requirement("quart"),
        requirement("quart_cors"),
        requirement("six"),
        requirement("sortedcontainers"),
        requirement("sqlalchemy"),
        requirement("toml"),
        requirement("typing_extensions"),
        requirement("urllib3"),
        requirement("wsproto"),
        "//quart_sqlalchemy",
    ],
)

filegroup(
    name = "main.zip",
    srcs = [":main"],
    output_group = "python_zip_file",
)

py_binary(
    name = "initdb",
    srcs = [
        "initdb.py",
    ],
    data = [
    ],
    deps = [
        ":main",
        "//app/migrations",
    ],
)

filegroup(
    name = "initdb.zip",
    srcs = [":initdb"],
    output_group = "python_zip_file",
)

py_binary(
    name = "schema_migrate",
    srcs = [
        "schema_migrate.py",
    ],
    data = [
    ],
    deps = [
        ":main",
        "//app/migrations",
    ] + all_requirements,
)

filegroup(
    name = "schema_migrate.zip",
    srcs = [":schema_migrate"],
    output_group = "python_zip_file",
)

py_binary(
    name = "hypercorn_bin",
    srcs = [
        "hypercorn_bin.py",
    ],
    deps = [
        ":main",
    ] + all_requirements,
)

filegroup(
    name = "hypercorn_bin.zip",
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
