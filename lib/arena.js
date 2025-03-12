// UTILITIES
function POST(url, body, auth){}

/**
@template T
@returns {Promise<T>}
*/
async function GET(url, auth){
  return fetch(url, {
    headers: { Authorization: `Bearer ${auth}` } 
  }).then((res) => res.json())
}

function PUT(){}
function DELETE(){}












/**
* @typedef {Object} Options
* @property {string} auth
* @property {string} host

* @typedef {Object} MaybeOptions
* @property {string=} auth
* @property {string=} host

* @param {MaybeOptions=} opts 
*/
function Arena(opts) {
  let auth = opts?.auth ? opts.auth : ""
  let host = opts?.host ? opts.host : "https://api.are.na/v2/"
  
  return {
    me: async () => {
      if (!auth) {
        console.warn("No Auth")  
        return 
      }

      return await GET(host + "me")
    },
    channel: (slug) => ({
      get: () => get_channel(slug, {auth, host}),
      create_block: () => {}
    }),
    
    block: (slug) => ({
      get: () => get_block(slug, {auth, host})
    })
  }
}

export {Arena}

//TEST("block")





/**
* @param {String} slug 
* @param {Options} opts 
* @returns {Promise<Channel>}
*/
async function get_channel(slug, opts){
  return await GET(opts.host + "channels/" + slug, opts.auth)
}

/**
* @typedef {Object} Channel 
* @property {number} id
* @property {string} title
* @property {Date} created_at
* @property {Date} updated_at
* @property {boolean} published
* @property {boolean} open
* @property {boolean} collaboration
* @property {string} slug
* @property {number} length
* @property {string} kind
* @property {string} status
* @property {number} user_id
* @property {string} class
* @property {string} base_class
* @property {User} user
* @property {number} total_pages
* @property {number} current_page
* @property {number} per
* @property {number} follower_count
* @property {(Block | Channel)[]} contents
*/












/**
* @param {(string | number)} slug 
* @param {Options} opts 
* @returns {Promise<Block>}
*/
async function get_block(slug, opts){
  return await GET(opts.host + "blocks/" + slug, opts)
}

/**
* @typedef {Object} Block
  @property {number} id
  @property {string | null} title
  @property {Date} updated_at
  @property {Date} created_at
  @property {"Available" | "Failure" | "Procesed" | "Processing"} state
  @property {number} comment_count
  @property {string} generated_title
  @property {"Image" | "Text" | "Link" | "Media" | "Attachment"} class
  @property {"Block"} base_class
  @property {string | null} content
  @property {string | null} content_html
  @property {string | null} description
  @property {string | null} description_html
  @property {null | { title?: string; url: string; provider: { name: string; url: string; } | null; }} source
  @property {null | { content_type: string; display: { url: string }; filename: string; lage: { url: string }, original: { file_size: number; file_size_display: string; url: string; }; square: { url: string }; thumb: { url: string }; updated_at: Date; }} image
*/





import {h, render,sig, mem}  from "/lib/solid/monke.js"
import {JsonViewer} from "/js/snippet/JsonViewer.json"

/**
@param {"channel" | "block"} type
*/
function TEST(type){
  let test_block_id = 31127597 
  let test_channel_slug = "jose-aisle" 
  document.body.style.fontFamily = "monospace"
  
  let bing = Arena()

  if (type == "channel"){
    bing.channel.get(test_channel_slug)
      .then((res) => {
        let new_ren = new JsonViewer(res)
        r.set(new_ren.render.bind(new_ren))
      })
  } 

  if(type == "block"){
    bing.block.get(test_block_id)
      .then((block) => {
        block.image?.thumb.url
        let new_ren = new JsonViewer(block)
        r.set(new_ren.render.bind(new_ren))
      })
  }

  let r = sig(() => h("div", "loading..."))
  render(() => r, document.body)
}























































































