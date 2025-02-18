/*jshint node:true */
'use strict';
export const load = function (ffmpeg) {
    ffmpeg
        .format('avi')
        .videoBitrate('1024k')
        .videoCodec('mpeg4')
        .size('720x?')
        .audioBitrate('128k')
        .audioChannels(2)
        .audioCodec('libmp3lame')
        .outputOptions(['-vtag DIVX']);
};
