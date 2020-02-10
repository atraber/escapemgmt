load("@rules_foreign_cc//tools/build_defs:configure.bzl", "configure_make")

configure_make(
    name = "ffmpeg",
    binaries = [
        "ffmpeg",
        "ffprobe",
    ],
    configure_options = [
        "--enable-libx264",
        "--enable-gpl",
    ],
    lib_name = "install",
    lib_source = "@ffmpeg//:all",
    # Optinal make commands, defaults to ["make", "make install"]
    make_commands = [
        "make -j8",
        "make install",
    ],
    static_libraries = [
        "libavcodec.a",
        "libavdevice.a",
        "libavfilter.a",
        "libavformat.a",
        "libavutil.a",
        "libpostproc.a",
        "libswresample.a",
        "libswscale.a",
    ],
    visibility = ["//visibility:public"],
)
