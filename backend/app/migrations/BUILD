package(default_visibility = ["//app:__subpackages__"])

py_library(
    name = "migrations",
    srcs = [
        "env.py",
    ] + glob(include = ["versions/*.py"]),
    data = [
        "alembic.ini",
    ],
)
