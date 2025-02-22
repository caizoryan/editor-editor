import sharp from "sharp"
import path from "path"

let media_dir = path.resolve("../../fs/media")
let p_1 = path.join(media_dir, "flip_1.jpg")
let p_2 = path.join(media_dir, "flip_2.jpg")

let o_1 = path.join(media_dir, "flipped_1.jpg")
let o_2 = path.join(media_dir, "flipped_2.jpg")

sharp(p_1).flip().rotate(180).toFile(o_1);
sharp(p_2).flip().rotate(180).toFile(o_2);
