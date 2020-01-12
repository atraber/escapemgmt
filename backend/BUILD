load("@rules_python//python:defs.bzl", "py_library")
load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_image",
    "container_push",
)
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")
load("@io_bazel_rules_docker//docker/package_managers:download_pkgs.bzl", "download_pkgs")
load("@io_bazel_rules_docker//docker/package_managers:install_pkgs.bzl", "install_pkgs")

package(default_visibility = ["//visibility:public"])

exports_files([
    "requirements.txt",
])

container_image(
    name = "backend",
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

container_push(
    name = "backend_push",
    format = "Docker",
    image = ":backend",
    registry = "192.168.29.232:5000",
    repository = "escape_backend",
    tag = "latest",
)
#
#genrule(
#    name = "main_tar",
#    srcs = ["//app/app:main.zip"],
#    outs = ["main.tar"],
#    cmd = "unzip -q $(location //app/app:main.zip) -d app && tar -cf $@ ./app",
#)
#
#genrule(
#    name = "hypercorn_tar",
#    srcs = ["//app:hypercorn.zip"],
#    outs = ["hypercorn.tar"],
#    cmd = "unzip -q $(location //app:hypercorn.zip) -d hypercorn && tar -cf $@ ./hypercorn",
#)
