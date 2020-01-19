load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library")
load("@io_bazel_rules_docker//go:image.bzl", "go_image")
load("@bazel_gazelle//:def.bzl", "gazelle")

go_image(
    name = "node_exporter2_image",
    embed = [":go_default_library"],
)

# gazelle:prefix main
gazelle(name = "gazelle")

go_binary(
    name = "node_exporter2",
    embed = [":go_default_library"],
)

go_library(
    name = "go_default_library",
    srcs = [
        "arp.go",
        "node_exporter2.go",
    ],
    importpath = "main",
    visibility = ["//visibility:private"],
    deps = [
        "@com_github_go_kit_kit//log:go_default_library",
        "@com_github_go_kit_kit//log/level:go_default_library",
        "@com_github_prometheus_client_golang//prometheus:go_default_library",
        "@com_github_prometheus_client_golang//prometheus/promhttp:go_default_library",
        "@com_github_prometheus_common//promlog:go_default_library",
        "@com_github_prometheus_common//promlog/flag:go_default_library",
        "@com_github_prometheus_common//version:go_default_library",
        "@com_github_prometheus_procfs//:go_default_library",
        "@in_gopkg_alecthomas_kingpin_v2//:go_default_library",
    ],
)
