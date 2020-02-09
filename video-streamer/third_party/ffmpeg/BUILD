load("@rules_foreign_cc//tools/build_defs:configure.bzl", "configure_make")

configure_make(
    name = "ffmpeg",
    binaries = [
        "ffmpeg",
        "ffprobe",
    ],
    lib_name = "install",
    lib_source = "@ffmpeg//:all",
    #configure_options = [],
    # Optinal make commands, defaults to ["make", "make install"]
    make_commands = [
        "make -j8",
        "make install",
    ],
    static_libraries = [
        "libswresample.a",
        "libswscale.a",
        "libavdevice.a",
        "libavformat.a",
        "libavcodec.a",
        "libavfilter.a",
        "libavutil.a",
    ],
    visibility = ["//visibility:public"],
)
