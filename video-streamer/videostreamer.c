// This file is based on some ideas and snippets from
// https://github.com/horgh/videostreamer. This implementation goes much
// further though and optionally re-encodes streams and also transcodes audio.

#include "videostreamer.h"
#include <errno.h>
#include <libavdevice/avdevice.h>
#include <libavutil/timestamp.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const int E_NO_STREAM_FOUND = -3;

void vs_log_packet(const AVFormatContext *const format_ctx,
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

void vs_log_audio_frame(const AVFrame *const frame) {
  printf("AVFrame:\n");
  printf("nb_samples: %d\n", frame->nb_samples);
  printf("format: %s\n", av_get_sample_fmt_name(frame->format));
  printf("sample_rate: %d\n", frame->sample_rate);
  printf("channels: %d\n", frame->channels);
  printf("pkt_size: %d\n", frame->pkt_size);
  printf("linesize[0]: %d\n", frame->linesize[0]);
  printf("pts: %ld\n", frame->pts);
  printf("pkt_dts: %ld\n", frame->pkt_dts);
}

void vs_init(void) {
  avdevice_register_all();

  avformat_network_init();
}

int vs_video_filter_init(struct VSInput *input, const char *filters_descr,
                         const bool verbose) {
  char args[512];
  int ret = 0;
  const AVFilter *buffersrc = avfilter_get_by_name("buffer");
  const AVFilter *buffersink = avfilter_get_by_name("buffersink");
  AVFilterInOut *outputs = avfilter_inout_alloc();
  AVFilterInOut *inputs = avfilter_inout_alloc();
  AVRational time_base =
      input->format_ctx->streams[input->vstream_idx]->time_base;

  input->filter_graph = avfilter_graph_alloc();
  if (outputs == NULL || inputs == NULL || input->filter_graph == NULL) {
    ret = AVERROR(ENOMEM);
    goto end;
  }

  // buffer video source: the decoded frames from the decoder will be inserted
  // here.
  snprintf(args, sizeof(args),
           "video_size=%dx%d:pix_fmt=%d:time_base=%d/%d:pixel_aspect=%d/%d",
           input->vdec_ctx->width, input->vdec_ctx->height,
           input->vdec_ctx->pix_fmt, time_base.num, time_base.den,
           input->vdec_ctx->sample_aspect_ratio.num,
           input->vdec_ctx->sample_aspect_ratio.den);
  if (verbose) {
    printf("args: %s\n", args);
  }

  ret = avfilter_graph_create_filter(&input->buffersrc_ctx, buffersrc, "in",
                                     args, NULL, input->filter_graph);
  if (ret < 0) {
    printf("Cannot create buffer source\n");
    goto end;
  }

  // buffer video sink: to terminate the filter chain.
  ret = avfilter_graph_create_filter(&input->buffersink_ctx, buffersink, "out",
                                     NULL, NULL, input->filter_graph);
  if (ret < 0) {
    printf("Cannot create buffer sink\n");
    goto end;
  }

  ret = av_opt_set_bin(
      input->buffersink_ctx, "pix_fmts", (uint8_t *)&input->venc_ctx->pix_fmt,
      sizeof(input->venc_ctx->pix_fmt), AV_OPT_SEARCH_CHILDREN);
  if (ret < 0) {
    av_log(NULL, AV_LOG_ERROR, "Cannot set output pixel format\n");
    goto end;
  }

  // Set the endpoints for the filter graph. The filter_graph will
  // be linked to the graph described by filters_descr.

  // The buffer source output must be connected to the input pad of
  // the first filter described by filters_descr; since the first
  // filter input label is not specified, it is set to "in" by
  // default.
  outputs->name = av_strdup("in");
  outputs->filter_ctx = input->buffersrc_ctx;
  outputs->pad_idx = 0;
  outputs->next = NULL;

  // The buffer sink input must be connected to the output pad of
  // the last filter described by filters_descr; since the last
  // filter output label is not specified, it is set to "out" by
  // default.
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

int vs_audio_filter_init(struct VSInput *input, const char *filters_descr,
                         const bool verbose) {
  char args[512];
  int ret = 0;
  const AVFilter *abuffersrc = avfilter_get_by_name("abuffer");
  const AVFilter *abuffersink = avfilter_get_by_name("abuffersink");
  AVFilterInOut *outputs = avfilter_inout_alloc();
  AVFilterInOut *inputs = avfilter_inout_alloc();
  AVRational time_base =
      input->format_ctx->streams[input->astream_idx]->time_base;

  input->afilter_graph = avfilter_graph_alloc();
  if (outputs == NULL || inputs == NULL || input->afilter_graph == NULL) {
    ret = AVERROR(ENOMEM);
    goto end;
  }

  if (!input->adec_ctx->channel_layout) {
    input->adec_ctx->channel_layout =
        av_get_default_channel_layout(input->adec_ctx->channels);
  }
  snprintf(
      args, sizeof(args),
      "time_base=%d/%d:sample_rate=%d:sample_fmt=%s:channel_layout=0x%" PRIx64,
      time_base.num, time_base.den, input->adec_ctx->sample_rate,
      av_get_sample_fmt_name(input->adec_ctx->sample_fmt),
      input->adec_ctx->channel_layout);
  if (verbose) {
    printf("args: %s\n", args);
  }

  ret = avfilter_graph_create_filter(&input->abuffersrc_ctx, abuffersrc, "in",
                                     args, NULL, input->afilter_graph);
  if (ret < 0) {
    printf("Cannot create buffer source\n");
    goto end;
  }

  // buffer video sink: to terminate the filter chain.
  ret = avfilter_graph_create_filter(&input->abuffersink_ctx, abuffersink,
                                     "out", NULL, NULL, input->afilter_graph);
  if (ret < 0) {
    printf("Cannot create buffer sink\n");
    goto end;
  }

  const enum AVSampleFormat out_sample_fmts[] = {input->aenc_ctx->sample_fmt,
                                                 -1};
  ret = av_opt_set_int_list(input->abuffersink_ctx, "sample_fmts",
                            out_sample_fmts, -1, AV_OPT_SEARCH_CHILDREN);
  if (ret < 0) {
    av_log(NULL, AV_LOG_ERROR, "Cannot set output sample format\n");
    goto end;
  }

  const int64_t out_channel_layouts[] = {input->aenc_ctx->channel_layout, -1};
  ret = av_opt_set_int_list(input->abuffersink_ctx, "channel_layouts",
                            out_channel_layouts, -1, AV_OPT_SEARCH_CHILDREN);
  if (ret < 0) {
    av_log(NULL, AV_LOG_ERROR, "Cannot set output channel layout\n");
    goto end;
  }

  const int out_sample_rates[] = {input->aenc_ctx->sample_rate, -1};
  ret = av_opt_set_int_list(input->abuffersink_ctx, "sample_rates",
                            out_sample_rates, -1, AV_OPT_SEARCH_CHILDREN);
  if (ret < 0) {
    av_log(NULL, AV_LOG_ERROR, "Cannot set output sample rate\n");
    goto end;
  }

  // Set the endpoints for the filter graph. The filter_graph will
  // be linked to the graph described by filters_descr.

  // The buffer source output must be connected to the input pad of
  // the first filter described by filters_descr; since the first
  // filter input label is not specified, it is set to "in" by
  // default.
  outputs->name = av_strdup("in");
  outputs->filter_ctx = input->abuffersrc_ctx;
  outputs->pad_idx = 0;
  outputs->next = NULL;

  // The buffer sink input must be connected to the output pad of
  // the last filter described by filters_descr; since the last
  // filter output label is not specified, it is set to "out" by
  // default.
  inputs->name = av_strdup("out");
  inputs->filter_ctx = input->abuffersink_ctx;
  inputs->pad_idx = 0;
  inputs->next = NULL;

  if ((ret = avfilter_graph_parse_ptr(input->afilter_graph, filters_descr,
                                      &inputs, &outputs, NULL)) < 0)
    goto end;

  if ((ret = avfilter_graph_config(input->afilter_graph, NULL)) < 0)
    goto end;

end:
  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);

  return ret;
}

int vs_input_video_encoder_open(struct VSInput *input, bool crop, int x, int y,
                                int width, int height, bool scale,
                                int out_width, int out_height, int orientation,
                                const bool verbose) {
  if (crop) {
    if (x + width > input->vdec_ctx->width) {
      printf("Input arguments are invalid: x + width > actual width: "
             "Adjusting.\n");
      width = input->vdec_ctx->width - x;
    }

    if (y + height > input->vdec_ctx->height) {
      printf("Input arguments are invalid: x + height > actual height: "
             "Adjusting.\n");
      height = input->vdec_ctx->height - y;
    }
  }

  AVCodec *enc = avcodec_find_encoder(input->vdec_ctx->codec_id);
  if (enc == NULL) {
    printf("Encoder does not exist\n");
    return -1;
  }

  input->venc_ctx = avcodec_alloc_context3(enc);
  if (input->venc_ctx == NULL) {
    printf("Could not allocate video codec context\n");
    return -1;
  }

  if (crop) {
    if (scale) {
      input->venc_ctx->width = out_width;
      input->venc_ctx->height = out_height;
    } else {
      input->venc_ctx->width = width;
      input->venc_ctx->height = height;
    }
  } else {
    if (scale) {
      input->venc_ctx->width = out_width;
      input->venc_ctx->height = out_height;
    } else {
      input->venc_ctx->width = input->vdec_ctx->width;
      input->venc_ctx->height = input->vdec_ctx->height;
    }
  }
  input->venc_ctx->sample_aspect_ratio = input->vdec_ctx->sample_aspect_ratio;
  input->venc_ctx->time_base = av_inv_q(input->vdec_ctx->framerate);

  // emit one intra frame every ten frames
  // check frame pict_type before passing frame
  // to encoder, if frame->pict_type is AV_PICTURE_TYPE_I
  // then gop_size is ignored and the output of encoder
  // will always be I frame irrespective to gop_size
  input->venc_ctx->gop_size = 10;
  input->venc_ctx->max_b_frames = 1;
  if (enc->pix_fmts)
    input->venc_ctx->pix_fmt = enc->pix_fmts[0];
  else
    input->venc_ctx->pix_fmt = input->vdec_ctx->pix_fmt;

  if (enc->id == AV_CODEC_ID_H264)
    av_opt_set(input->venc_ctx->priv_data, "preset", "ultrafast", 0);

  if (avcodec_open2(input->venc_ctx, enc, NULL) < 0) {
    printf("cannot open video encoder\n");
    return -1;
  }

  char filter_desc[512];
  char filter_desc_dup[512];
  filter_desc[0] = '\0';
  if (crop) {
    strncpy(filter_desc_dup, filter_desc, sizeof(filter_desc));
    if (snprintf(filter_desc, sizeof(filter_desc), "%scrop=%d:%d:%d:%d,",
                 filter_desc_dup, width, height, x, y) < 0) {
      printf("Failed to create filter desc\n");
      return -1;
    }
  }
  if (orientation != 0) {
    strncpy(filter_desc_dup, filter_desc, sizeof(filter_desc));
    if (orientation == 90) {
      if (snprintf(filter_desc, sizeof(filter_desc), "%stranspose=dir=1,",
                   filter_desc_dup) < 0) {
        printf("Failed to create filter desc\n");
        return -1;
      }
    } else {
      printf("Cannot make sense of orientation %d\n", orientation);
      return -1;
    }
  }
  if (scale) {
    strncpy(filter_desc_dup, filter_desc, sizeof(filter_desc));
    if (snprintf(filter_desc, sizeof(filter_desc), "%sscale=%d:%d,",
                 filter_desc_dup, out_width, out_height) < 0) {
      printf("Failed to create filter desc\n");
      return -1;
    }
  }

  // If we haven't applied any other filters yet, we apply the "nothing" filter.
  if (strlen(filter_desc) == 0) {
    if (snprintf(filter_desc, sizeof(filter_desc), "null") < 0) {
      printf("Failed to create filter desc\n");
      return -1;
    }
  } else {
    // If there is a ',' at the end, remove it.
    int filter_desc_len = strlen(filter_desc);
    if (filter_desc[filter_desc_len - 1] == ',') {
      filter_desc[filter_desc_len - 1] = '\0';
    }
  }

  if (verbose) {
    printf("filter_desc is %s\n", filter_desc);
  }

  if (vs_video_filter_init(input, filter_desc, verbose) != 0) {
    printf("failed to initalize filters\n");
    return -1;
  }

  return 0;
}

int vs_input_audio_encoder_open(struct VSInput *input, const bool verbose) {
  AVCodec *enc = avcodec_find_encoder(AV_CODEC_ID_AAC);
  if (enc == NULL) {
    printf("Encoder does not exist\n");
    return -1;
  }

  input->aenc_ctx = avcodec_alloc_context3(enc);
  if (input->aenc_ctx == NULL) {
    printf("Could not allocate audio codec context\n");
    return -1;
  }

  input->aenc_ctx->bit_rate = input->adec_ctx->bit_rate;
  // Cannot use the following since it may use an incompatible format.
  // input->aenc_ctx->sample_fmt = input->adec_ctx->sample_fmt;
  input->aenc_ctx->sample_fmt = AV_SAMPLE_FMT_FLTP;
  // input->aenc_ctx->sample_rate = input->adec_ctx->sample_rate;
  input->aenc_ctx->sample_rate = 48000;
  input->aenc_ctx->channels = input->adec_ctx->channels;
  input->aenc_ctx->channel_layout =
      av_get_default_channel_layout(input->adec_ctx->channels);

  input->aenc_ctx->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
  // input->aenc_ctx->strict_std_compliance = FF_COMPLIANCE_EXPERIMENTAL;

  if (avcodec_open2(input->aenc_ctx, enc, NULL) < 0) {
    printf("cannot open audio encoder\n");
    return -1;
  }

  printf("audio context has %d frame size\n", input->aenc_ctx->frame_size);

  char filter_desc[512];
  if (snprintf(filter_desc, sizeof(filter_desc), "anull") < 0) {
    printf("Failed to create filter desc\n");
    return -1;
  }

  if (vs_audio_filter_init(input, filter_desc, verbose) != 0) {
    printf("failed to initalize filters\n");
    return -1;
  }

  input->afifo = av_audio_fifo_alloc(input->aenc_ctx->sample_fmt,
                                     input->aenc_ctx->channels, 1);
  if (input->afifo == NULL) {
    printf("Could not allocate FIFO\n");
    return AVERROR(ENOMEM);
  }

  return 0;
}

int vs_input_stream_open(AVFormatContext *format_ctx, enum AVMediaType type,
                         int *stream_index, AVCodecContext **dec_ctx) {
  if (dec_ctx == NULL) {
    return -1;
  }

  AVCodec *dec;
  *stream_index = av_find_best_stream(format_ctx, type, -1, -1, &dec, 0);
  if (*stream_index < 0) {
    printf("Cannot find a stream in the input file\n");
    return E_NO_STREAM_FOUND;
  }

  *dec_ctx = avcodec_alloc_context3(dec);
  if (*dec_ctx == NULL) {
    printf("unable to alloc context\n");
    return -1;
  }
  avcodec_parameters_to_context(*dec_ctx,
                                format_ctx->streams[*stream_index]->codecpar);

  (*dec_ctx)->framerate =
      av_guess_frame_rate(format_ctx, format_ctx->streams[*stream_index], NULL);
  if (avcodec_open2(*dec_ctx, dec, NULL) < 0) {
    printf("cannot open decoder\n");
    return -1;
  }

  return 0;
}

static struct VSInput *vs_input_alloc() {
  struct VSInput *const input = malloc(sizeof(*input));
  if (input == NULL) {
    printf("%s\n", strerror(errno));
    return NULL;
  }
  memset(input, 0, sizeof(*input));
  input->vstream_idx = -1;
  input->astream_idx = -1;

  return input;
}

struct VSInput *vs_input_open(const char *const input_format_name,
                              const char *const input_url, int probesize,
                              int analyze_duration, const bool verbose) {
  if (input_format_name == NULL || strlen(input_format_name) == 0 ||
      input_url == NULL || strlen(input_url) == 0) {
    printf("%s\n", strerror(EINVAL));
    return NULL;
  }

  struct VSInput *const input = vs_input_alloc();
  if (input == NULL) {
    printf("Couldn't allocate VSInput\n");
    return NULL;
  }

  AVInputFormat *const input_format = av_find_input_format(input_format_name);
  if (input_format == NULL) {
    printf("input format not found\n");
    vs_input_free(input);
    return NULL;
  }

  input->format_ctx = avformat_alloc_context();
  input->format_ctx->max_delay = 1000;
  input->format_ctx->flags |= AVFMT_FLAG_NOBUFFER;
  input->format_ctx->probesize = probesize;
  input->format_ctx->fps_probe_size = 5;
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

  av_dump_format(input->format_ctx, 0, input_url, 0);

  int err = vs_input_stream_open(input->format_ctx, AVMEDIA_TYPE_VIDEO,
                                 &input->vstream_idx, &input->vdec_ctx);
  if (err != 0 && err != E_NO_STREAM_FOUND) {
    printf("Cannot open input video codec\n");
    vs_input_free(input);
    return NULL;
  }

  err = vs_input_stream_open(input->format_ctx, AVMEDIA_TYPE_AUDIO,
                             &input->astream_idx, &input->adec_ctx);
  if (err != 0 && err != E_NO_STREAM_FOUND) {
    printf("Cannot open input audio codec\n");
    vs_input_free(input);
    return NULL;
  }

  if (input->vstream_idx < 0 && input->astream_idx < 0) {
    printf("Neither video nor audio stream found\n");
    return NULL;
  }

  return input;
}

struct VSInfo *vs_stream_info(struct VSInput *input) {
  if (input == NULL) {
    return NULL;
  }

  struct VSInfo *retval = malloc(sizeof(*retval));
  retval->width = input->vdec_ctx->width;
  retval->height = input->vdec_ctx->height;

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

  if (input->venc_ctx != NULL) {
    avcodec_free_context(&input->venc_ctx);
    input->venc_ctx = NULL;
  }

  if (input->vdec_ctx != NULL) {
    avcodec_free_context(&input->vdec_ctx);
    input->vdec_ctx = NULL;
  }

  if (input->aenc_ctx != NULL) {
    avcodec_free_context(&input->aenc_ctx);
    input->aenc_ctx = NULL;
  }

  if (input->adec_ctx != NULL) {
    avcodec_free_context(&input->adec_ctx);
    input->adec_ctx = NULL;
  }

  if (input->format_ctx != NULL) {
    avformat_close_input(&input->format_ctx);
    input->format_ctx = NULL;
  }

  if (input->afifo != NULL) {
    av_audio_fifo_free(input->afifo);
  }

  free(input);
}

int vs_duplicate_stream(AVStream *const in_stream,
                        AVFormatContext *format_ctx) {
  AVStream *const out_stream = avformat_new_stream(format_ctx, NULL);
  if (out_stream == NULL) {
    printf("unable to add stream\n");
    return -1;
  }

  if (avcodec_parameters_copy(out_stream->codecpar, in_stream->codecpar) < 0) {
    printf("unable to copy codec parameters\n");
    return -1;
  }

  return 0;
}

int vs_create_stream_from_codec(AVCodecContext *enc,
                                AVFormatContext *format_ctx) {
  AVStream *const out_stream = avformat_new_stream(format_ctx, NULL);
  if (out_stream == NULL) {
    printf("unable to add stream\n");
    return -1;
  }

  if (avcodec_parameters_from_context(out_stream->codecpar, enc) < 0) {
    printf("unable to copy codec parameters\n");
    return -1;
  }

  return 0;
}

struct VSOutput *vs_open_output(const char *const output_format_name,
                                const char *const output_url,
                                const struct VSInput *const input,
                                const bool verbose) {
  if (output_format_name == NULL || strlen(output_format_name) == 0 ||
      output_url == NULL || strlen(output_url) == 0 || input == NULL) {
    printf("%s\n", strerror(EINVAL));
    return NULL;
  }

  struct VSOutput *const output = malloc(sizeof(*output));
  if (output == NULL) {
    printf("%s\n", strerror(errno));
    return NULL;
  }

  AVOutputFormat *const output_format =
      av_guess_format(output_format_name, NULL, NULL);
  if (output_format == NULL) {
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

  // First open video, then audio.
  if (input->vstream_idx >= 0) {
    if (input->venc_ctx == NULL) {
      if (vs_duplicate_stream(input->format_ctx->streams[input->vstream_idx],
                              output->format_ctx) != 0) {
        printf("Unable to duplicate video stream\n");
        vs_destroy_output(output);
        return NULL;
      }
    } else {
      if (vs_create_stream_from_codec(input->venc_ctx, output->format_ctx) !=
          0) {
        printf("Unable to create video stream\n");
        vs_destroy_output(output);
        return NULL;
      }
    }
  }
  output->vstream_idx = input->vstream_idx;

  if (input->astream_idx >= 0) {
    if (input->aenc_ctx == NULL) {
      if (vs_duplicate_stream(input->format_ctx->streams[input->astream_idx],
                              output->format_ctx) != 0) {
        printf("Unable to duplicate audio stream\n");
        vs_destroy_output(output);
        return NULL;
      }
    } else {
      if (vs_create_stream_from_codec(input->aenc_ctx, output->format_ctx) !=
          0) {
        printf("Unable to create audio stream\n");
        vs_destroy_output(output);
        return NULL;
      }
    }
  }
  output->astream_idx = input->astream_idx;

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
  output->alast_dts = AV_NOPTS_VALUE;

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
  if (pkt->stream_index != input->vstream_idx &&
      pkt->stream_index != input->astream_idx) {
    if (verbose) {
      printf("skipping packet from input stream %d\n", pkt->stream_index);
    }

    av_packet_unref(pkt);
    return 0;
  }

  if (verbose) {
    vs_log_packet(input->format_ctx, pkt, "in");
  }

  return 1;
}

static int init_output_frame(AVFrame **frame, AVCodecContext *enc_ctx,
                             int frame_size) {

  // Create a new frame to store the audio samples.
  *frame = av_frame_alloc();
  if (*frame == NULL) {
    printf("Could not allocate output frame\n");
    return -1;
  }

  // Set the frame's parameters, especially its size and format.
  // av_frame_get_buffer needs this to allocate memory for the
  // audio samples of the frame.
  // Default channel layouts based on the number of channels
  // are assumed for simplicity.
  (*frame)->nb_samples = frame_size;
  (*frame)->channel_layout = enc_ctx->channel_layout;
  (*frame)->format = enc_ctx->sample_fmt;
  (*frame)->sample_rate = enc_ctx->sample_rate;

  // Allocate the samples of the created frame. This call will make
  // sure that the audio frame can hold as many samples as specified.
  int error = av_frame_get_buffer(*frame, 0);
  if (error < 0) {
    printf("Could not allocate output frame samples (error '%s')\n",
           av_err2str(error));
    av_frame_free(frame);
    return error;
  }

  return 0;
}

static int encode_audio_frame(AVFrame *frame, AVCodecContext *enc_ctx,
                              int64_t *pts) {
  frame->pts = *pts;
  *pts += frame->nb_samples;

  int err = avcodec_send_frame(enc_ctx, frame);
  if (err == AVERROR_EOF) {
    return 0;
  } else if (err < 0) {
    printf("Could not send packet for encoding (error '%s')\n",
           av_err2str(err));
    return err;
  }
  return 0;
}

static int load_encode_audio(AVAudioFifo *fifo, AVCodecContext *enc_ctx,
                             int64_t *pts) {
  // Use the maximum number of possible samples per frame.
  // If there is less than the maximum possible frame size in the FIFO
  // buffer use this number. Otherwise, use the maximum possible frame size.
  const int frame_size = FFMIN(av_audio_fifo_size(fifo), enc_ctx->frame_size);

  // Initialize temporary storage for one output frame.
  AVFrame *output_frame;
  if (init_output_frame(&output_frame, enc_ctx, frame_size) != 0)
    return -1;

  // Read as many samples from the FIFO buffer as required to fill the frame.
  // The samples are stored in the frame temporarily.
  if (av_audio_fifo_read(fifo, (void **)output_frame->data, frame_size) <
      frame_size) {
    printf("Could not read data from FIFO\n");
    av_frame_free(&output_frame);
    return -1;
  }

  // Encode one frame worth of audio samples.
  int err = encode_audio_frame(output_frame, enc_ctx, pts);
  av_frame_free(&output_frame);
  if (err != 0) {
    return -1;
  }
  return 0;
}

int vs_send_audio_frame(AVFrame *frame, AVAudioFifo *fifo,
                        AVCodecContext *enc_ctx) {
  // Store the new samples in the FIFO buffer.
  if (av_audio_fifo_write(fifo, (void **)frame->data, frame->nb_samples) <
      frame->nb_samples) {
    printf("Could not write data to FIFO\n");
    return -1;
  }

  return 0;
}

int vs_filter_packet_ctx(AVPacket *const pkt, AVCodecContext *dec_ctx,
                         AVCodecContext *enc_ctx,
                         AVFilterContext *buffersrc_ctx,
                         AVFilterContext *buffersink_ctx, const bool verbose) {
  int ret = avcodec_send_packet(dec_ctx, pkt);
  if (ret < 0) {
    printf("Error while sending a packet to the decoder\n");
    return -1;
  }

  AVFrame *frame = av_frame_alloc();

  while (ret >= 0) {
    ret = avcodec_receive_frame(dec_ctx, frame);
    if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
      break;
    } else if (ret < 0) {
      printf("Error while receiving a frame from the decoder\n");
      break;
    }

    // TODO: Is this necessary?
    frame->pts = frame->best_effort_timestamp;

    // Push the decoded frame into the filtergraph.
    if (av_buffersrc_add_frame_flags(buffersrc_ctx, frame,
                                     AV_BUFFERSRC_FLAG_KEEP_REF) < 0) {
      printf("Error while feeding the filtergraph\n");
      break;
    }

    // Pull filtered frames from the filtergraph.
    AVFrame *filt_frame = av_frame_alloc();
    while (1) {
      ret = av_buffersink_get_frame(buffersink_ctx, filt_frame);
      if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
        break;
      }
      if (ret < 0) {
        printf("Error getting frame from buffersink: %s\n", av_err2str(ret));
        continue;
      }
      filt_frame->pict_type = AV_PICTURE_TYPE_NONE;
      ret = avcodec_send_frame(enc_ctx, filt_frame);
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

int vs_filter_packet_audio(AVPacket *const pkt, AVCodecContext *dec_ctx,
                           AVCodecContext *enc_ctx,
                           AVFilterContext *buffersrc_ctx,
                           AVFilterContext *buffersink_ctx, AVAudioFifo *fifo,
                           const bool verbose) {
  int ret = avcodec_send_packet(dec_ctx, pkt);
  if (ret < 0) {
    printf("Error while sending a packet to the decoder\n");
    return -1;
  }

  AVFrame *frame = av_frame_alloc();

  while (ret >= 0) {
    ret = avcodec_receive_frame(dec_ctx, frame);
    if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
      break;
    } else if (ret < 0) {
      printf("Error while receiving a frame from the decoder\n");
      break;
    }

    // Push the decoded frame into the filtergraph.
    if (av_buffersrc_add_frame_flags(buffersrc_ctx, frame,
                                     AV_BUFFERSRC_FLAG_KEEP_REF) < 0) {
      printf("Error while feeding the filtergraph\n");
      break;
    }

    // Pull filtered frames from the filtergraph.
    AVFrame *filt_frame = av_frame_alloc();
    while (1) {
      ret = av_buffersink_get_frame(buffersink_ctx, filt_frame);
      if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
        break;
      }
      if (ret < 0) {
        printf("Error getting frame from buffersink: %s\n", av_err2str(ret));
        continue;
      }
      if (vs_send_audio_frame(filt_frame, fifo, enc_ctx) != 0) {
        printf("Error sending audio frame to encoder\n");
      }
    }
    av_frame_free(&filt_frame);
  }
  av_frame_free(&frame);
  return 0;
}

int vs_filter_packet(struct VSInput *input, AVPacket *const pkt,
                     const bool verbose) {
  if (pkt->stream_index == input->vstream_idx) {
    return vs_filter_packet_ctx(pkt, input->vdec_ctx, input->venc_ctx,
                                input->buffersrc_ctx, input->buffersink_ctx,
                                verbose);
  } else if (pkt->stream_index == input->astream_idx) {
    return vs_filter_packet_audio(pkt, input->adec_ctx, input->aenc_ctx,
                                  input->abuffersrc_ctx, input->abuffersink_ctx,
                                  input->afifo, verbose);
  } else {
    return 0;
  }
}

int vs_get_filtered_packet_ctx(AVCodecContext *enc_ctx, AVPacket *pkt) {
  int ret = avcodec_receive_packet(enc_ctx, pkt);
  if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
    return -1;
  else if (ret < 0) {
    fprintf(stderr, "Error during encoding\n");
    return -1;
  }
  return 1;
}

int vs_get_filtered_packet_audio(AVCodecContext *enc_ctx, AVAudioFifo *fifo,
                                 int64_t *pts, AVPacket *pkt) {
  if (av_audio_fifo_size(fifo) >= enc_ctx->frame_size) {
    if (load_encode_audio(fifo, enc_ctx, pts) != 0) {
      printf("Unable to load and encode frame\n");
      return -1;
    }
  }
  int ret = avcodec_receive_packet(enc_ctx, pkt);
  if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF)
    return -1;
  else if (ret < 0) {
    fprintf(stderr, "Error during encoding\n");
    return -1;
  }
  return 1;
}

// Returns:
// -1 if error
// 0 if nothing useful read (e.g., non-video packet)
// 1 if read a packet
int vs_get_filtered_packet(struct VSInput *input, AVPacket *pkt,
                           const bool verbose) {
  if (input == NULL || pkt == NULL) {
    printf("%s\n", strerror(errno));
    return -1;
  }

  int ret = 0;
  if (input->venc_ctx != NULL) {
    ret = vs_get_filtered_packet_ctx(input->venc_ctx, pkt);
    pkt->stream_index = input->vstream_idx;
  }
  if (ret != 1 && input->aenc_ctx != NULL) {
    ret = vs_get_filtered_packet_audio(input->aenc_ctx, input->afifo,
                                       &input->apts, pkt);
    pkt->stream_index = input->astream_idx;
  }
  if (ret != 1) {
    return ret;
  }

  if (verbose) {
    printf("Write packet %3" PRId64 " (size=%5d)\n", pkt->pts, pkt->size);
  }
  return 1;
}

int vs_packet_fix_timestamps(AVPacket *const pkt, int64_t last_dts,
                             AVRational in_tb, AVRational out_tb,
                             const bool verbose) {
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
  bool fix_dts = pkt->dts != AV_NOPTS_VALUE && last_dts != AV_NOPTS_VALUE &&
                 pkt->dts <= last_dts;

  // It is also possible for input streams to include a packet with
  // dts/pts=NOPTS after packets with dts/pts set. These won't be caught by the
  // prior case. If we try to send these to the encoder however, we'll generate
  // the same error (non monotonically increasing DTS) since the output packet
  // will have dts/pts=0.
  fix_dts |= pkt->dts == AV_NOPTS_VALUE && last_dts != AV_NOPTS_VALUE;

  if (fix_dts) {
    int64_t const next_dts = last_dts + 1;

    if (verbose) {
      printf("Warning: Non-monotonous DTS in input stream. Previous: %" PRId64
             " current: %" PRId64 ". changing to %" PRId64 ".\n",
             last_dts, pkt->dts, next_dts);
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
  if (pkt->dts == AV_NOPTS_VALUE) {
    pkt->dts = 0;
  } else {
    pkt->dts = av_rescale_q_rnd(pkt->dts, in_tb, out_tb,
                                AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
  }

  if (pkt->pts == AV_NOPTS_VALUE) {
    pkt->pts = pkt->dts == AV_NOPTS_VALUE ? 0 : pkt->dts;
  } else {
    pkt->pts = av_rescale_q_rnd(pkt->pts, in_tb, out_tb,
                                AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX);
  }

  pkt->duration = av_rescale_q(pkt->duration, in_tb, out_tb);
  pkt->pos = -1;

  // PTS can never be smaller than DTS.
  if (pkt->pts < pkt->dts) {
    pkt->pts = pkt->dts;
  }

  return 0;
}

// We change the packet's pts, dts, duration, pos.
//
// We do not unref it.
//
// Returns:
// -1 if error
// 1 if we wrote the packet
int vs_write_packet(struct VSOutput *const output, AVPacket *const pkt,
                    AVRational pkt_tb, const bool verbose) {
  if (!output || !pkt) {
    printf("%s\n", strerror(EINVAL));
    return -1;
  }

  // If there are multiple input streams, then the stream index on the packet
  // may not match the stream index in our output. We need to ensure the index
  // matches. Note by this point we have checked that it is indeed a packet
  // from the stream we want (we do this when reading the packet).
  //
  // As we only ever have a single output stream (one, video), the index will
  // be 0.
  if (pkt->stream_index == output->vstream_idx) {
    if (verbose) {
      printf("updating packet stream index to 0 (from %d)\n",
             pkt->stream_index);
    }
    pkt->stream_index = 0;

    AVStream *const out_stream = output->format_ctx->streams[pkt->stream_index];
    if (out_stream == NULL) {
      printf("output stream not found with stream index %d\n",
             pkt->stream_index);
      return -1;
    }

    if (vs_packet_fix_timestamps(pkt, output->last_dts, pkt_tb,
                                 out_stream->time_base, verbose) != 0) {
      printf("Could not fix timestamps");
      return -1;
    }

    output->last_dts = pkt->dts;
  } else if (pkt->stream_index == output->astream_idx) {
    if (verbose) {
      printf("updating packet stream index to 1 (from %d)\n",
             pkt->stream_index);
    }
    pkt->stream_index = 1;

    AVStream *const out_stream = output->format_ctx->streams[pkt->stream_index];
    if (out_stream == NULL) {
      printf("output stream not found with stream index %d\n",
             pkt->stream_index);
      return -1;
    }

    if (vs_packet_fix_timestamps(pkt, output->alast_dts, pkt_tb,
                                 out_stream->time_base, verbose) != 0) {
      printf("Could not fix timestamps");
      return -1;
    }

    output->alast_dts = pkt->dts;
  }

  if (verbose) {
    vs_log_packet(output->format_ctx, pkt, "out");
  }

  // Write encoded frame (as a packet).
  // av_interleaved_write_frame() works too, but I don't think it is needed.
  // Using av_write_frame() skips buffering.
  const int write_res = av_write_frame(output->format_ctx, pkt);
  if (write_res < 0) {
    printf("unable to write frame: %s\n", av_err2str(write_res));
    return -1;
  }

  if (verbose) {
    printf("Wrote packet with dts %ld; pts %ld\n", pkt->dts, pkt->pts);
  }
  return 1;
}

int vs_packet_timebase(struct VSInput *input, AVPacket *const pkt,
                       AVRational *pkt_tb) {
  if (input == NULL || pkt == NULL || pkt_tb == NULL) {
    return -1;
  }
  *pkt_tb = input->format_ctx->streams[pkt->stream_index]->time_base;
  return 0;
}
