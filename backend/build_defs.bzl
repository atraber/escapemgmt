load(
    "@io_bazel_rules_docker//container:container.bzl",
    "container_push",
)

def backend_push(name, tag):
    container_push(
        name = name,
        format = "Docker",
        image = ":backend_image",
        registry = "192.168.0.80:5000",
        repository = "escape_backend",
        tag = tag,
    )
