load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library")
load("@io_bazel_rules_docker//go:image.bzl", "go_image")
load("@bazel_gazelle//:def.bzl", "gazelle")

go_image(
    name = "video_streamer_image",
    embed = [":go_default_library"],
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
        "-lz",
        "-lx264",
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
    deps = ["//third_party/ffmpeg"],
)
