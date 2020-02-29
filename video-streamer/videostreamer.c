//
// This library provides remuxing from a video stream (such as an RTSP URL) to
// an MP4 container. It writes a fragmented MP4 so that it can be streamed to a
// pipe.
//
// There is no re-encoding. The stream is copied as is.
//
// The logic here is heavily based on remuxing.c by Stefano Sabatini.
//

#include "videostreamer.h"
#include <errno.h>
#include <libavdevice/avdevice.h>
#include <libavutil/timestamp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void __vs_log_packet(const AVFormatContext *const, const AVPacket *const,
                            const char *const);

void vs_init(void) {
  avdevice_register_all();

  avformat_network_init();
}

int vs_filter_init(struct VSInput *input, const char *filters_descr,
                   const bool verbose) {
  char args[512];
  int ret = 0;
  const AVFilter *buffersrc = avfilter_get_by_name("buffer");
  const AVFilter *buffersink = avfilter_get_by_name("buffersink");
  AVFilterInOut *outputs = avfilter_inout_alloc();
  AVFilterInOut *inputs = avfilter_inout_alloc();
  AVRational time_base =
      input->format_ctx->streams[input->video_stream_index]->time_base;

  input->filter_graph = avfilter_graph_alloc();
  if (outputs == NULL || inputs == NULL || input->filter_graph == NULL) {
    ret = AVERROR(ENOMEM);
    goto end;
  }

  /* buffer video source: the decoded frames from the decoder will be inserted
   * here. */
  snprintf(args, sizeof(args),
           "video_size=%dx%d:pix_fmt=%d:time_base=%d/%d:pixel_aspect=%d/%d",
           input->dec_ctx->width, input->dec_ctx->height,
           input->dec_ctx->pix_fmt, time_base.num, time_base.den,
           input->dec_ctx->sample_aspect_ratio.num,
           input->dec_ctx->sample_aspect_ratio.den);
  if (verbose) {
    printf("args: %s\n", args);
  }

  ret = avfilter_graph_create_filter(&input->buffersrc_ctx, buffersrc, "in",
                                     args, NULL, input->filter_graph);
  if (ret < 0) {
    printf("Cannot create buffer source\n");
    goto end;
  }

  /* buffer video sink: to terminate the filter chain. */
  ret = avfilter_graph_create_filter(&input->buffersink_ctx, buffersink, "out",
                                     NULL, NULL, input->filter_graph);
  if (ret < 0) {
    printf("Cannot create buffer sink\n");
    goto end;
  }

  ret = av_opt_set_bin(input->buffersink_ctx, "pix_fmts",
                       (uint8_t *)&input->enc_ctx->pix_fmt,
                       sizeof(input->enc_ctx->pix_fmt), AV_OPT_SEARCH_CHILDREN);
  if (ret < 0) {
    av_log(NULL, AV_LOG_ERROR, "Cannot set output pixel format\n");
    goto end;
  }

  /*
   * Set the endpoints for the filter graph. The filter_graph will
   * be linked to the graph described by filters_descr.
   */

  /*
   * The buffer source output must be connected to the input pad of
   * the first filter described by filters_descr; since the first
   * filter input label is not specified, it is set to "in" by
   * default.
   */
  outputs->name = av_strdup("in");
  outputs->filter_ctx = input->buffersrc_ctx;
  outputs->pad_idx = 0;
  outputs->next = NULL;

  /*
   * The buffer sink input must be connected to the output pad of
   * the last filter described by filters_descr; since the last
   * filter output label is not specified, it is set to "out" by
   * default.
   */
  inputs->name = av_strdup("out");
  inputs->filter_ctx = input->buffersink_ctx;
  inputs->pad_idx = 0;
  inputs->next = NULL;

  if ((ret = avfilter_graph_parse_ptr(input->filter_graph, filters_descr,
                                      &inputs, &outputs, NULL)) < 0)
    goto end;

  if ((ret = avfilter_graph_config(input->filter_graph, NULL)) < 0)
    goto end;

end:
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);

  return ret;
}

int vs_input_encoder_open(struct VSInput *input, bool crop, int x, int y,
                          int width, int height, bool scale, int out_width,
                          int out_height, const bool verbose) {
  if (crop) {
    if (x + width > input->dec_ctx->width) {
      printf("Input arguments are invalid: x + width > actual width: "
             "Adjusting.\n");
      width = input->dec_ctx->width - x;
    }

    if (y + height > input->dec_ctx->height) {
      printf("Input arguments are invalid: x + height > actual height: "
             "Adjusting.\n");
      height = input->dec_ctx->height - y;
    }
  }

  AVCodec *enc = avcodec_find_encoder(input->dec_ctx->codec_id);
  if (enc == NULL) {
    printf("Encoder does not exists\n");
    return -1;
  }

  input->enc_ctx = avcodec_alloc_context3(enc);
  if (input->enc_ctx == NULL) {
    printf("Could not allocate video codec context\n");
    return -1;
  }

  if (crop) {
    if (scale) {
      input->enc_ctx->width = out_width;
      input->enc_ctx->height = out_height;
    } else {
      input->enc_ctx->width = width;
      input->enc_ctx->height = height;
    }
  } else {
    if (scale) {
      input->enc_ctx->width = out_width;
      input->enc_ctx->height = out_height;
    } else {
      input->enc_ctx->width = input->dec_ctx->width;
      input->enc_ctx->height = input->dec_ctx->height;
    }
  }
  input->enc_ctx->sample_aspect_ratio = input->dec_ctx->sample_aspect_ratio;
  input->enc_ctx->framerate = (AVRational){25, 1};
  input->enc_ctx->time_base = av_inv_q(input->enc_ctx->framerate);

  /* emit one intra frame every ten frames
   * check frame pict_type before passing frame
   * to encoder, if frame->pict_type is AV_PICTURE_TYPE_I
   * then gop_size is ignored and the output of encoder
   * will always be I frame irrespective to gop_size
   */
  input->enc_ctx->gop_size = 10;
  input->enc_ctx->max_b_frames = 1;
  if (enc->pix_fmts)
    input->enc_ctx->pix_fmt = enc->pix_fmts[0];
  else
    input->enc_ctx->pix_fmt = input->dec_ctx->pix_fmt;

  if (enc->id == AV_CODEC_ID_H264)
    av_opt_set(input->enc_ctx->priv_data, "preset", "ultrafast", 0);

  if (avcodec_open2(input->enc_ctx, enc, NULL) < 0) {
    printf("cannot open video encoder\n");
    return -1;
  }

  char filter_desc[512];
  if (crop) {
    if (scale) {
      if (snprintf(filter_desc, sizeof(filter_desc),
                   "crop=%d:%d:%d:%d,scale=%d:%d", width, height, x, y,
                   out_width, out_height) < 0) {
        printf("Failed to create filter desc\n");
        return -1;
      }
    } else {
      if (snprintf(filter_desc, sizeof(filter_desc), "crop=%d:%d:%d:%d", width,
                   height, x, y) < 0) {
        printf("Failed to create filter desc\n");
        return -1;
      }
    }
  } else {
    if (scale) {
      if (snprintf(filter_desc, sizeof(filter_desc), "scale=%d:%d", out_width,
                   out_height) < 0) {
        printf("Failed to create filter desc\n");
        return -1;
      }
    } else {
      if (snprintf(filter_desc, sizeof(filter_desc), "null") < 0) {
        printf("Failed to create filter desc\n");
        return -1;
      }
    }
  }

  if (vs_filter_init(input, filter_desc, verbose) != 0) {
    printf("failed to initalize filters\n");
    return -1;
  }

  return 0;
}

struct VSInput *vs_input_open(const char *const input_format_name,
                              const char *const input_url, int probesize,
                              int analyze_duration, const bool verbose) {
  if (input_format_name == NULL || strlen(input_format_name) == 0 ||
      input_url == NULL || strlen(input_url) == 0) {
    printf("%s\n", strerror(EINVAL));
    return NULL;
  }

  struct VSInput *const input = malloc(sizeof(*input));
  if (input == NULL) {
    printf("%s\n", strerror(errno));
    return NULL;
  }
  memset(input, 0, sizeof(*input));

  AVInputFormat *const input_format = av_find_input_format(input_format_name);
  if (input_format == NULL) {
    printf("input format not found\n");
    vs_input_free(input);
    return NULL;
  }

  input->format_ctx = avformat_alloc_context();
  input->format_ctx->probesize = probesize;
  input->format_ctx->max_analyze_duration = analyze_duration;

  int const open_status =
      avformat_open_input(&input->format_ctx, input_url, input_format, NULL);
  if (open_status != 0) {
    printf("unable to open input: %s\n", av_err2str(open_status));
    vs_input_free(input);
    return NULL;
  }

  if (avformat_find_stream_info(input->format_ctx, NULL) < 0) {
    printf("failed to find stream info\n");
    vs_input_free(input);
    return NULL;
  }

  if (verbose) {
    av_dump_format(input->format_ctx, 0, input_url, 0);
  }

  AVCodec *dec;
  /* select the video stream */
  int ret = av_find_best_stream(input->format_ctx, AVMEDIA_TYPE_VIDEO, -1, -1,
                                &dec, 0);
  if (ret < 0) {
    printf("Cannot find a video stream in the input file\n");
    vs_input_free(input);
    return NULL;
  }
  input->video_stream_index = ret;

  /* create decoding context */
  input->dec_ctx = avcodec_alloc_context3(dec);
  if (!input->dec_ctx) {
    printf("unable to alloc context\n");
    vs_input_free(input);
    return NULL;
  }
  avcodec_parameters_to_context(
      input->dec_ctx,
      input->format_ctx->streams[input->video_stream_index]->codecpar);

  /* init the video decoder */
  if (avcodec_open2(input->dec_ctx, dec, NULL) < 0) {
    printf("cannot open video decoder\n");
    vs_input_free(input);
    return NULL;
  }

  return input;
}

struct VSInfo *vs_stream_info(struct VSInput *input) {
  if (input == NULL) {
    return NULL;
  }

  struct VSInfo *retval = malloc(sizeof(*retval));
  retval->width = input->dec_ctx->width;
  retval->height = input->dec_ctx->height;

  if (retval->width == 0 || retval->height == 0) {
    return NULL;
  }

  return retval;
}

void vs_input_free(struct VSInput *const input) {
  if (input == NULL) {
    return;
  }

  if (input->filter_graph != NULL) {
    avfilter_graph_free(&input->filter_graph);
    input->filter_graph = NULL;
  }

  if (input->enc_ctx != NULL) {
    avcodec_free_context(&input->enc_ctx);
    input->enc_ctx = NULL;
  }

  if (input->dec_ctx != NULL) {
    avcodec_free_context(&input->dec_ctx);
    input->dec_ctx = NULL;
  }

  if (input->format_ctx != NULL) {
    avformat_close_input(&input->format_ctx);
    input->format_ctx = NULL;
  }

  free(input);
}

struct VSOutput *vs_open_output(const char *const output_format_name,
                                const char *const output_url,
                                const struct VSInput *const input,
                                const bool verbose) {
  if (!output_format_name || strlen(output_format_name) == 0 || !output_url ||
      strlen(output_url) == 0 || !input) {
    printf("%s\n", strerror(EINVAL));
    return NULL;
  }

  struct VSOutput *const output = calloc(1, sizeof(struct VSOutput));
  if (!output) {
    printf("%s\n", strerror(errno));
    return NULL;
  }

  AVOutputFormat *const output_format =
      av_guess_format(output_format_name, NULL, NULL);
  if (!output_format) {
    printf("output format not found\n");
    vs_destroy_output(output);
    return NULL;
  }

  if (avformat_alloc_output_context2(&output->format_ctx, output_format, NULL,
                                     NULL) < 0) {
    printf("unable to create output context\n");
    vs_destroy_output(output);
    return NULL;
  }

  // Copy the video stream.

  AVStream *const out_stream = avformat_new_stream(output->format_ctx, NULL);
  if (!out_stream) {
    printf("unable to add stream\n");
    vs_destroy_output(output);
    return NULL;
  }

  AVStream *const in_stream =
      input->format_ctx->streams[input->video_stream_index];

  if (avcodec_parameters_copy(out_stream->codecpar, in_stream->codecpar) < 0) {
    printf("unable to copy codec parameters\n");
    vs_destroy_output(output);
    return NULL;
  }

  if (verbose) {
    av_dump_format(output->format_ctx, 0, output_url, 1);
  }

  // Open output file.
  if (avio_open(&output->format_ctx->pb, output_url, AVIO_FLAG_WRITE) < 0) {
    printf("unable to open output file\n");
    vs_destroy_output(output);
    return NULL;
  }

  // Write file header.

  AVDictionary *opts = NULL;

  // -movflags frag_keyframe tells the mp4 muxer to fragment at each video
  // keyframe. This is necessary for it to support output to a non-seekable
  // file (e.g., pipe).
  //
  // -movflags isml+frag_keyframe is the same, except isml appears to be to
  // make the output a live smooth streaming feed (as opposed to not live). I'm
  // not sure the difference, but isml appears to be a microsoft
  // format/protocol.
  //
  // To specify both, use isml+frag_keyframe as the value.
  //
  // I found that while Chrome had no trouble displaying the resulting mp4 with
  // just frag_keyframe, Firefox would not until I also added empty_moov.
  // empty_moov apparently writes some info at the start of the file.
  if (av_dict_set(&opts, "movflags", "frag_keyframe+empty_moov", 0) < 0) {
    printf("unable to set movflags opt\n");
    vs_destroy_output(output);
    return NULL;
  }

  if (av_dict_set_int(&opts, "flush_packets", 1, 0) < 0) {
    printf("unable to set flush_packets opt\n");
    vs_destroy_output(output);
    av_dict_free(&opts);
    return NULL;
  }

  if (avformat_write_header(output->format_ctx, &opts) < 0) {
    printf("unable to write header\n");
    vs_destroy_output(output);
    av_dict_free(&opts);
    return NULL;
  }

  // Check any options that were not set. Because I'm not sure if all are
  // appropriate to set through the avformat_write_header().
  if (av_dict_count(opts) != 0) {
    printf("some options not set\n");
    vs_destroy_output(output);
    av_dict_free(&opts);
    return NULL;
  }

  av_dict_free(&opts);

  output->last_dts = AV_NOPTS_VALUE;

  return output;
}

void vs_destroy_output(struct VSOutput *const output) {
  if (!output) {
    return;
  }

  if (output->format_ctx) {
    if (av_write_trailer(output->format_ctx) != 0) {
      printf("unable to write trailer\n");
    }

    if (avio_closep(&output->format_ctx->pb) != 0) {
      printf("avio_closep failed\n");
    }

    avformat_free_context(output->format_ctx);
  }

  free(output);
}

// Read a compressed and encoded frame as a packet.
//
// Returns:
// -1 if error
// 0 if nothing useful read (e.g., non-video packet)
// 1 if read a packet
int vs_read_packet(const struct VSInput *input, AVPacket *const pkt,
                   const bool verbose) {
  if (!input || !pkt) {
    printf("%s\n", strerror(errno));
    return -1;
  }

  memset(pkt, 0, sizeof(AVPacket));

  // Read encoded frame (as a packet).
  if (av_read_frame(input->format_ctx, pkt) != 0) {
    printf("unable to read frame\n");
    return -1;
  }

  // Ignore it if it's not our video stream.
  if (pkt->stream_index != input->video_stream_index) {
    if (verbose) {
      printf(
          "skipping packet from input stream %d, our video is from stream %d\n",
          pkt->stream_index, input->video_stream_index);
    }

    av_packet_unref(pkt);
    return 0;
  }

  if (verbose) {
    __vs_log_packet(input->format_ctx, pkt, "in");
  }

  return 1;
}

int vs_filter_packet(const struct VSInput *input, AVPacket *const pkt,
                     const bool verbose) {
  if (pkt->stream_index != input->video_stream_index) {
    return 0;
  }

  int ret = avcodec_send_packet(input->dec_ctx, pkt);
  if (ret < 0) {
    printf("Error while sending a packet to the decoder\n");
    return -1;
  }

  AVFrame *frame = av_frame_alloc();

  while (ret >= 0) {
    ret = avcodec_receive_frame(input->dec_ctx, frame);
    if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
      break;
    } else if (ret < 0) {
      printf("Error while receiving a frame from the decoder\n");
      break;
    }

    frame->pts = frame->best_effort_timestamp;

    /* push the decoded frame into the filtergraph */
    if (av_buffersrc_add_frame_flags(input->buffersrc_ctx, frame,
                                     AV_BUFFERSRC_FLAG_KEEP_REF) < 0) {
      printf("Error while feeding the filtergraph\n");
      break;
    }

    /* pull filtered frames from the filtergraph */
    AVFrame *filt_frame = av_frame_alloc();
    while (1) {
      ret = av_buffersink_get_frame(input->buffersink_ctx, filt_frame);
      if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
        break;
      }
      if (ret < 0) {
        printf("Error getting frame from buffersink: %s\n", av_err2str(ret));
        continue;
      }
      filt_frame->pict_type = AV_PICTURE_TYPE_NONE;
      ret = avcodec_send_frame(input->enc_ctx, filt_frame);
      if (ret < 0) {
        printf("Error sending a frame for encoding: %s\n", av_err2str(ret));
        continue;
      }
    }
    av_frame_free(&filt_frame);
  }
  av_frame_free(&frame);
  return 0;
}

// Returns:
// -1 if error
// 0 if nothing useful read (e.g., non-video packet)
// 1 if read a packet
int vs_get_filtered_packet(const struct VSInput *input, AVPacket *pkt,
                           const bool verbose) {
  if (!input || !pkt) {
    printf("%s\n", strerror(errno));
    return -1;
  }

  int ret = avcodec_receive_packet(input->enc_ctx, pkt);
  if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
    return -1;
  else if (ret < 0) {
    fprintf(stderr, "Error during encoding\n");
    return -1;
  }

  printf("Write packet %3" PRId64 " (size=%5d)\n", pkt->pts, pkt->size);
  return 1;
}

// We change the packet's pts, dts, duration, pos.
//
// We do not unref it.
//
// Returns:
// -1 if error
// 1 if we wrote the packet
int vs_write_packet(const struct VSInput *const input,
                    struct VSOutput *const output, AVPacket *const pkt,
                    const bool verbose) {
  if (!input || !output || !pkt) {
    printf("%s\n", strerror(EINVAL));
    return -1;
  }

  AVStream *const in_stream = input->format_ctx->streams[pkt->stream_index];
  if (!in_stream) {
    printf("input stream not found with stream index %d\n", pkt->stream_index);
    return -1;
  }

  // If there are multiple input streams, then the stream index on the packet
  // may not match the stream index in our output. We need to ensure the index
  // matches. Note by this point we have checked that it is indeed a packet
  // from the stream we want (we do this when reading the packet).
  //
  // As we only ever have a single output stream (one, video), the index will
  // be 0.
  if (pkt->stream_index != 0) {
    if (verbose) {
      printf("updating packet stream index to 0 (from %d)\n",
             pkt->stream_index);
    }

    pkt->stream_index = 0;
  }

  AVStream *const out_stream = output->format_ctx->streams[pkt->stream_index];
  if (!out_stream) {
    printf("output stream not found with stream index %d\n", pkt->stream_index);
    return -1;
  }

  // It is possible that the input is not well formed. Its dts (decompression
  // timestamp) may fluctuate. av_write_frame() says that the dts must be
  // strictly increasing.
  //
  // Packets from such inputs might look like:
  //
  // in: pts:18750 pts_time:0.208333 dts:18750 dts_time:0.208333 duration:3750
  // duration_time:0.0416667 stream_index:1 in: pts:0 pts_time:0 dts:0
  // dts_time:0 duration:3750 duration_time:0.0416667 stream_index:1
  //
  // dts here is 18750 and then 0.
  //
  // If we try to write the second packet as is, we'll see this error:
  // [mp4 @ 0x10f1ae0] Application provided invalid, non monotonically
  // increasing dts to muxer in stream 1: 18750 >= 0
  //
  // This is apparently a fairly common problem. In ffmpeg.c (as of ffmpeg
  // 3.2.4 at least) there is logic to rewrite the dts and warn if it happens.
  // Let's do the same. Note my logic is a little different here.
  bool fix_dts = pkt->dts != AV_NOPTS_VALUE &&
                 output->last_dts != AV_NOPTS_VALUE &&
                 pkt->dts <= output->last_dts;

  // It is also possible for input streams to include a packet with
  // dts/pts=NOPTS after packets with dts/pts set. These won't be caught by the
  // prior case. If we try to send these to the encoder however, we'll generate
  // the same error (non monotonically increasing DTS) since the output packet
  // will have dts/pts=0.
  fix_dts |= pkt->dts == AV_NOPTS_VALUE && output->last_dts != AV_NOPTS_VALUE;

  if (fix_dts) {
    int64_t const next_dts = output->last_dts + 1;

    if (verbose) {
      printf("Warning: Non-monotonous DTS in input stream. Previous: %" PRId64
             " current: %" PRId64 ". changing to %" PRId64 ".\n",
             output->last_dts, pkt->dts, next_dts);
    }

    // We also apparently (ffmpeg.c does this too) need to update the pts.
    // Otherwise we see an error like:
    //
    // [mp4 @ 0x555e6825ea60] pts (3780) < dts (22531) in stream 0

    if (pkt->pts != AV_NOPTS_VALUE && pkt->pts >= pkt->dts) {
      pkt->pts = FFMAX(pkt->pts, next_dts);
    }
    // In the case where pkt->dts was AV_NOPTS_VALUE, pkt->pts can be
    // AV_NOPTS_VALUE too which we fix as well.
    if (pkt->pts == AV_NOPTS_VALUE) {
      pkt->pts = next_dts;
    }

    pkt->dts = next_dts;
  }

  // Set pts/dts if not set. Otherwise we will receive warnings like
  //
  // [mp4 @ 0x55688397bc40] Timestamps are unset in a packet for stream 0. This
  // is deprecated and will stop working in the future. Fix your code to set
  // the timestamps properly
  //
  // [mp4 @ 0x55688397bc40] Encoder did not produce proper pts, making some up.
  if (pkt->pts == AV_NOPTS_VALUE) {
    pkt->pts = 0;
  } else {
    pkt->pts =
        av_rescale_q_rnd(pkt->pts, in_stream->time_base, out_stream->time_base,
                         AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
  }

  if (pkt->dts == AV_NOPTS_VALUE) {
    pkt->dts = 0;
  } else {
    pkt->dts =
        av_rescale_q_rnd(pkt->dts, in_stream->time_base, out_stream->time_base,
                         AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
  }

  pkt->duration =
      av_rescale_q(pkt->duration, in_stream->time_base, out_stream->time_base);
  pkt->pos = -1;

  // PTS can never be smaller than DTS.
  if (pkt->pts < pkt->dts)
    pkt->pts = pkt->dts;

  if (verbose) {
    __vs_log_packet(output->format_ctx, pkt, "out");
  }

  // Track last dts we see (see where we use it for why).
  output->last_dts = pkt->dts;

  // Write encoded frame (as a packet).

  // av_interleaved_write_frame() works too, but I don't think it is needed.
  // Using av_write_frame() skips buffering.
  const int write_res = av_write_frame(output->format_ctx, pkt);
  if (write_res != 0) {
    printf("unable to write frame: %s\n", av_err2str(write_res));
    return -1;
  }

  printf("Wrote packet with dts %ld; pts %ld\n", pkt->dts, pkt->pts);
  return 1;
}

static void __vs_log_packet(const AVFormatContext *const format_ctx,
                            const AVPacket *const pkt, const char *const tag) {
  AVRational *const time_base =
      &format_ctx->streams[pkt->stream_index]->time_base;

  printf("%s: pts:%s pts_time:%s dts:%s dts_time:%s duration:%s "
         "duration_time:%s stream_index:%d\n",
         tag, av_ts2str(pkt->pts), av_ts2timestr(pkt->pts, time_base),
         av_ts2str(pkt->dts), av_ts2timestr(pkt->dts, time_base),
         av_ts2str(pkt->duration), av_ts2timestr(pkt->duration, time_base),
         pkt->stream_index);
}
