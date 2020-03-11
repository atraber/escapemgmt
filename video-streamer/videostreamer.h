#ifndef _VIDEOSTREAMER_H
#define _VIDEOSTREAMER_H

#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavformat/avformat.h>
#include <libavutil/audio_fifo.h>
#include <stdbool.h>
#include <stdint.h>

struct VSInput {
  AVFormatContext *format_ctx;
  AVCodecContext *vdec_ctx;
  AVCodecContext *venc_ctx;
  int vstream_idx;
  AVFilterContext *buffersrc_ctx;
  AVFilterContext *buffersink_ctx;
  AVFilterGraph *filter_graph;
  int astream_idx;
  AVCodecContext *adec_ctx;
  AVCodecContext *aenc_ctx;
  AVFilterContext *abuffersrc_ctx;
  AVFilterContext *abuffersink_ctx;
  AVFilterGraph *afilter_graph;
  AVAudioFifo *afifo;
  int64_t apts;
};

struct VSOutput {
  AVFormatContext *format_ctx;

  int vstream_idx;
  // Track the last dts we output. We use it to double check that dts is
  // monotonic.
  //
  // I am not sure if it is available anywhere already. I tried
  // AVStream->info->last_dts and that is apparently not set.
  int64_t last_dts;
  int astream_idx;
  int64_t alast_dts;
};

struct VSInfo {
  int width;
  int height;
};

void vs_init(void);

struct VSInput *vs_input_open(const char *const input_format_name,
                              const char *const input_url, int probesize,
                              int analyze_duration, const bool verbose);
int vs_input_video_encoder_open(struct VSInput *input, bool crop, int x, int y,
                                int width, int height, bool scale,
                                int out_width, int out_height,
                                const bool verbose);
int vs_input_audio_encoder_open(struct VSInput *input, const bool verbose);

void vs_input_free(struct VSInput *const);
struct VSInfo *vs_stream_info(struct VSInput *input);

struct VSOutput *vs_open_output(const char *const, const char *const,
                                const struct VSInput *const, const bool);

void vs_destroy_output(struct VSOutput *const);

int vs_read_packet(const struct VSInput *, AVPacket *const, const bool);

int vs_write_packet(struct VSOutput *const output, AVPacket *const pkt,
                    AVRational pkt_tb, const bool verbose);

int vs_filter_packet(struct VSInput *, AVPacket *const, const bool);
int vs_get_filtered_packet(struct VSInput *input, AVPacket *pkt,
                           const bool verbose);
int vs_packet_timebase(struct VSInput *input, AVPacket *const pkt,
                       AVRational *pkt_tb);

#endif
