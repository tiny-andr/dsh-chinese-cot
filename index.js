/**
 * Chinese chain-of-thought injection.
 *
 * Registers one global prompt section at the lowest order in the registry, so
 * its text renders as the first line of every assembled system prompt (main
 * agent, subagents and workflow children alike). The section text is read from
 * live plugin state on every assembly, so a change from the settings page takes
 * effect on the next model step without restarting anything.
 *
 * Settings live in a small JSON document under the harness home; the Web
 * settings page talks to this plugin through the route registered below.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** The one service this plugin cannot work without. */
export const inject = ['systemPrompt']

/** Fallback text, also used by the settings page's reset action. */
const DEFAULT_TEXT = '请全程使用中文进行思考！'

/** Section key in the global prompt registry (must be unique). */
const SECTION_NAME = 'dsh-chinese-cot:first-line'

/**
 * Sort order. The harness identity opener sits at -1000 and every first-party
 * section above that, so a far lower finite order guarantees the first line.
 */
const SECTION_ORDER = -100000

/** Exact path of the settings route served to the Web client. */
const API_PATH = '/dsh-chinese-cot/api'

/** Upper bound for the injected text, in characters. */
const MAX_TEXT_LENGTH = 4000

/**
 * Resolve the directory holding this plugin's settings document.
 * @param ctx - the plugin context.
 * @returns a directory path; the harness home when the profile exposes one.
 */
function resolveHome(ctx) {
  const fromProfile = ctx?.profileContext?.home
  if (typeof fromProfile === 'string' && fromProfile.length > 0) return fromProfile
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv
  return join(homedir(), '.dsh')
}

/**
 * Write one JSON response.
 * @param res - the HTTP response.
 * @param status - the HTTP status code.
 * @param body - the JSON-serializable body.
 */
function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

/**
 * Read a bounded JSON request body.
 * @param req - the HTTP request.
 * @returns the parsed body, or `{}` for an empty body.
 */
async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('request body is too large')
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw.length === 0 ? {} : JSON.parse(raw)
}

/**
 * Plugin body.
 * @param ctx - the plugin context.
 */
export function apply(ctx) {
  const settingsFile = join(resolveHome(ctx), 'dsh-chinese-cot.json')
  const state = { enabled: true, text: DEFAULT_TEXT }
  let loaded = false

  const load = async () => {
    try {
      const parsed = JSON.parse(await readFile(settingsFile, 'utf8'))
      if (typeof parsed?.enabled === 'boolean') state.enabled = parsed.enabled
      if (typeof parsed?.text === 'string') state.text = parsed.text
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        ctx.logger?.warn?.(`dsh-chinese-cot: cannot read ${settingsFile}: ${error?.message ?? error}`)
      }
    } finally {
      loaded = true
    }
  }

  const persist = async () => {
    await mkdir(dirname(settingsFile), { recursive: true })
    await writeFile(
      settingsFile,
      `${JSON.stringify({ enabled: state.enabled, text: state.text }, null, 2)}\n`,
      'utf8',
    )
  }

  const view = () => ({ enabled: state.enabled, text: state.text, file: settingsFile, loaded })

  void load()

  ctx.effect(
    () => ctx.systemPrompt.section({
      name: SECTION_NAME,
      order: SECTION_ORDER,
      // Literal text: user content must never be parsed as a prompt variable.
      interpolate: false,
      text: () => (state.enabled && state.text.trim().length > 0 ? state.text : ''),
    }),
    'dsh-chinese-cot: first-line section',
  )

  ctx.inject(['webServer', 'connection'], (hostCtx) => {
    hostCtx.effect(
      () => hostCtx.webServer.register({
        kind: 'exact',
        path: API_PATH,
        handler: async (req, res) => {
          const rejection = hostCtx.connection.requestRejection({ headers: req.headers })
          if (rejection !== undefined) {
            sendJson(res, rejection, { ok: false, error: 'forbidden' })
            return
          }
          if (req.method !== 'POST') {
            sendJson(res, 405, { ok: false, error: 'method not allowed' })
            return
          }
          let body
          try {
            body = await readJsonBody(req)
          } catch (error) {
            sendJson(res, 400, { ok: false, error: `invalid request body: ${error?.message ?? error}` })
            return
          }
          const action = body?.action ?? 'get'
          try {
            if (action === 'get') {
              if (!loaded) await load().catch(() => {})
              sendJson(res, 200, { ok: true, value: view() })
              return
            }
            if (action === 'save') {
              if (typeof body.enabled !== 'boolean') throw new Error('enabled must be a boolean')
              if (typeof body.text !== 'string') throw new Error('text must be a string')
              if (body.text.length > MAX_TEXT_LENGTH) {
                throw new Error(`text must be at most ${MAX_TEXT_LENGTH} characters`)
              }
              state.enabled = body.enabled
              state.text = body.text
              await persist()
              sendJson(res, 200, { ok: true, value: view() })
              return
            }
            sendJson(res, 400, { ok: false, error: `unknown action: ${String(action)}` })
          } catch (error) {
            sendJson(res, 400, { ok: false, error: error?.message ?? String(error) })
          }
        },
      }),
      'dsh-chinese-cot: settings route',
    )
  })
}
