load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library")
load("@bazel_gazelle//:def.bzl", "gazelle")
load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_image",
    "container_push",
)
load("@io_bazel_rules_docker//docker/package_managers:download_pkgs.bzl", "download_pkgs")
load("@io_bazel_rules_docker//docker/package_managers:install_pkgs.bzl", "install_pkgs")

download_pkgs(
    name = "ubuntu_download_pkgs",
    image_tar = "@video_streamer_base//image",
    packages = [
        "libasound2",
        "libxcb-shape0",
        "libxcb-shm0",
        "libxcb-xfixes0",
    ],
)

install_pkgs(
    name = "ubuntu_install_pkgs",
    image_tar = "@video_streamer_base//image",
    installables_tar = ":ubuntu_download_pkgs.tar",
    output_image_name = "ubuntu_install_pkgs",
)

container_image(
    name = "video_streamer_image",
    base = ":ubuntu_install_pkgs.tar",
    cmd = [
        "/video_streamer",
    ],
    files = [
        "//:video_streamer",
    ],
)

container_push(
    name = "video_streamer_push",
    format = "Docker",
    image = ":video_streamer_image",
    registry = "192.168.0.80:5000",
    repository = "escape_video_streamer",
    tag = "prod",
)

# gazelle:prefix main
gazelle(name = "gazelle")

go_binary(
    name = "video_streamer",
    embed = [":go_default_library"],
)

go_library(
    name = "go_default_library",
    srcs = [
        "videostreamer.go",
    ],
    cdeps = [
        ":video_streamer_clib",
        "//third_party/ffmpeg",
        "//third_party/x264",
        "@zlib//:zlib",
    ],
    cgo = True,
    clinkopts = [
        "-lasound",
        "-lbz2",
        "-llzma",
        "-lxcb",
        "-lxcb-shape",
        "-lxcb-shm",
        "-lxcb-xfixes",
    ],
    importpath = "main",
    visibility = ["//visibility:private"],
)

cc_library(
    name = "video_streamer_clib",
    srcs = [
        "videostreamer.c",
    ],
    hdrs = ["videostreamer.h"],
    deps = [
        "//third_party/ffmpeg",
    ],
)
