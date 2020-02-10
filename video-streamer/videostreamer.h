#ifndef _VIDEOSTREAMER_H
#define _VIDEOSTREAMER_H

#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavformat/avformat.h>
#include <stdbool.h>
#include <stdint.h>

struct VSInput {
  AVFormatContext *format_ctx;
  AVCodecContext *dec_ctx;
  AVCodecContext *enc_ctx;
  int video_stream_index;
  AVFilterContext *buffersrc_ctx;
  AVFilterContext *buffersink_ctx;
  AVFilterGraph *filter_graph;
};

struct VSOutput {
  AVFormatContext *format_ctx;

  // Track the last dts we output. We use it to double check that dts is
  // monotonic.
  //
  // I am not sure if it is available anywhere already. I tried
  // AVStream->info->last_dts and that is apparently not set.
  int64_t last_dts;
};

void vs_init(void);

struct VSInput *vs_input_open(const char *const, const char *const, const bool);
int vs_input_encoder_open(struct VSInput *input, bool crop, int x, int y,
                          int width, int height, const bool verbose);

void vs_input_free(struct VSInput *const);

struct VSOutput *vs_open_output(const char *const, const char *const,
                                const struct VSInput *const, const bool);

void vs_destroy_output(struct VSOutput *const);

int vs_read_packet(const struct VSInput *, AVPacket *const, const bool);

int vs_write_packet(const struct VSInput *const, struct VSOutput *const,
                    AVPacket *const, const bool);

int vs_filter_packet(const struct VSInput *, AVPacket *const, const bool);
int vs_get_filtered_packet(const struct VSInput *input, AVPacket *pkt,
                           const bool verbose);

#endif
