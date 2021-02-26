load("@rules_python//python:defs.bzl", "py_library")
load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_image",
    "container_push",
)
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")
load("@io_bazel_rules_docker//docker/package_managers:download_pkgs.bzl", "download_pkgs")
load("@io_bazel_rules_docker//docker/package_managers:install_pkgs.bzl", "install_pkgs")
load(":build_defs.bzl", "backend_push")

package(default_visibility = ["//visibility:public"])

exports_files([
    "requirements.txt",
])

alias(
    name = "backend_dev",
    actual = "//app:main",
)

container_image(
    name = "backend_image",
    base = "@backend_base//image",
    cmd = [
        "python3",
        "/hypercorn_bin.zip",
        "-b",
        ":8080",
        "-w",
        "10",
        "main:application",
    ],
    files = [
        "//app:hypercorn_bin.zip",
    ],
)

backend_push(
    name = "backend_push",
    tag = "latest",
)

backend_push(
    name = "backend_canary_push",
    tag = "canary",
)

container_image(
    name = "backend_initdb",
    base = "@backend_base//image",
    cmd = [
        "python3",
        "/initdb.zip",
    ],
    files = [
        "//app:initdb.zip",
    ],
)

container_push(
    name = "backend_initdb_push",
    format = "Docker",
    image = ":backend_initdb",
    registry = "192.168.0.80:5000",
    repository = "escape_backend_initdb",
    tag = "latest",
)

container_image(
    name = "backend_migrate",
    base = "@backend_base//image",
    cmd = [
        "python3",
        "/schema_migrate.zip",
    ],
    files = [
        "//app:schema_migrate.zip",
    ],
)

container_push(
    name = "backend_migrate_push",
    format = "Docker",
    image = ":backend_migrate",
    registry = "192.168.0.80:5000",
    repository = "escape_backend_migrate",
    tag = "latest",
)
