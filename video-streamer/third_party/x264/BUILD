load("@rules_foreign_cc//tools/build_defs:configure.bzl", "configure_make")

configure_make(
    name = "x264",
    binaries = [
    ],
    configure_options = [
        "--disable-asm",
        "--disable-opencl",
    ],
    lib_name = "install",
    lib_source = "@x264//:all",
    # Optinal make commands, defaults to ["make", "make install"]
    make_commands = [
        "make -j8 lib-static",
        "make install-lib-static",
    ],
    static_libraries = [
        "libx264.a",
    ],
    visibility = ["//visibility:public"],
)
