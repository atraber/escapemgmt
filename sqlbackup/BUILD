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
    image_tar = "@container_base//image",
    packages = [
        "ca-certificates",
        "postgresql-client-11",
    ],
)

install_pkgs(
    name = "ubuntu_install_pkgs",
    image_tar = "@container_base//image",
    installables_tar = ":ubuntu_download_pkgs.tar",
    output_image_name = "ubuntu_install_pkgs",
)

container_image(
    name = "sqlbackup_image",
    base = ":ubuntu_install_pkgs",
    cmd = [
        "/sqlbackup",
    ],
    files = [
        "//:sqlbackup",
    ],
)

container_push(
    name = "sqlbackup_push",
    format = "Docker",
    image = ":sqlbackup_image",
    registry = "192.168.0.80:5000",
    repository = "sqlbackup",
    tag = "prod",
)

# gazelle:prefix main
gazelle(name = "gazelle")

go_binary(
    name = "sqlbackup",
    embed = [":go_default_library"],
    visibility = ["//visibility:public"],
)

go_library(
    name = "go_default_library",
    srcs = ["sqlbackup.go"],
    importpath = "main",
    visibility = ["//visibility:private"],
    deps = [
        "@com_github_google_logger//:go_default_library",
        "@com_github_minio_minio_go_v6//:go_default_library",
        "@org_golang_google_api//drive/v3:go_default_library",
        "@org_golang_x_net//context:go_default_library",
        "@org_golang_x_oauth2//:go_default_library",
        "@org_golang_x_oauth2//google:go_default_library",
    ],
)
