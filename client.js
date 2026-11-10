/**
 * Web half: one page in Settings -> Plugins (or its own nav row) with the
 * injection switch, the editable text and an explicit save button.
 *
 * The page talks to the Host half through the plugin's own route, so it needs
 * no generated RPC schema and no Harness Client package.
 */

window.__ModuleLoader__.load({
  id: 'dsh-chinese-cot',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const API_PATH = '/dsh-chinese-cot/api'
    const SECTION_ID = 'dsh-chinese-cot'
    const DEFAULT_TEXT = '请全程使用中文进行思考！'

    const STRINGS = {
      zh: {
        nav: '中文思考注入',
        switchLabel: '启用注入',
        switchHelp: '关闭后不向系统提示词添加任何内容。',
        textLabel: '注入内容',
        textHelp: '这段文字会插到系统提示词的最前面，成为提示词的第一行（每个模型请求、每个子代理都一样）。',
        firstLine: '系统提示词第一行',
        emptyPreview: '（内容为空，不会注入）',
        save: '保存',
        reset: '恢复默认',
        discard: '撤销修改',
        saved: '已保存，下一步请求即生效。',
        dirty: '有未保存的修改。',
        loading: '读取中…',
        saving: '保存中…',
        stateOn: '已开启',
        stateOff: '已关闭',
        fileLabel: '配置文件',
        loadFailed: '读取设置失败',
        saveFailed: '保存失败',
        retry: '重新读取',
      },
      en: {
        nav: 'Chinese CoT',
        switchLabel: 'Enable injection',
        switchHelp: 'When off, nothing is added to the system prompt.',
        textLabel: 'Injected text',
        textHelp: 'This text is placed at the very front of the system prompt, as its first line, for every model request and every subagent.',
        firstLine: 'First line of the system prompt',
        emptyPreview: '(empty, nothing is injected)',
        save: 'Save',
        reset: 'Reset to default',
        discard: 'Discard changes',
        saved: 'Saved. The next request uses it.',
        dirty: 'Unsaved changes.',
        loading: 'Loading…',
        saving: 'Saving…',
        stateOn: 'On',
        stateOff: 'Off',
        fileLabel: 'Settings file',
        loadFailed: 'Could not read the settings',
        saveFailed: 'Save failed',
        retry: 'Reload',
      },
    }

    const styles = {
      page: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '680px',
        padding: '4px 0 24px',
        color: 'var(--dsw-alias-label-primary)',
        fontSize: '13px',
        lineHeight: '1.55',
      },
      row: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      },
      switchRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      },
      title: {
        fontSize: '13px',
        fontWeight: '600',
      },
      help: {
        fontSize: '12px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      textarea: {
        width: '100%',
        minHeight: '92px',
        resize: 'vertical',
        boxSizing: 'border-box',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: '13px',
        lineHeight: '1.55',
      },
      switch: {
        width: '18px',
        height: '18px',
        accentColor: 'var(--dsw-alias-brand-primary)',
        cursor: 'pointer',
        flexShrink: '0',
      },
      preview: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px dashed var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      },
      actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      },
      button: {
        padding: '6px 14px',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: '13px',
        cursor: 'pointer',
      },
      primaryButton: {
        padding: '6px 16px',
        borderRadius: '8px',
        border: '1px solid var(--dsw-alias-brand-primary)',
        background: 'transparent',
        color: 'var(--dsw-alias-brand-primary)',
        fontFamily: 'inherit',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
      },
      pill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        borderRadius: '999px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'var(--dsw-alias-bg-layer-1)',
        fontSize: '11px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      notice: {
        fontSize: '12px',
        color: 'var(--dsw-alias-state-success-primary)',
      },
      error: {
        fontSize: '12px',
        color: 'var(--dsw-alias-state-error-primary)',
      },
      footnote: {
        fontSize: '11px',
        color: 'var(--dsw-alias-label-secondary)',
        wordBreak: 'break-all',
      },
      mono: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      },
    }

    /**
     * Read a locale id from the client locale service.
     * @param locale - the client locale service, possibly unavailable.
     * @returns a lowercase locale id such as `zh-cn`, or ''.
     */
    function localeId(locale) {
      try {
        const snapshot = locale?.getLocale?.()
        const id = snapshot?.id ?? snapshot?.locale
        return typeof id === 'string' ? id.toLowerCase() : ''
      } catch {
        return ''
      }
    }

    /**
     * Build the translate function for a locale id.
     * @param id - the lowercase locale id.
     * @returns the string table.
     */
    function stringsFor(id) {
      return id.startsWith('zh') ? STRINGS.zh : STRINGS.en
    }

    /**
     * Call the Host half's settings route.
     * @param action - `get` or `save`.
     * @param patch - additional request fields.
     * @returns the returned settings view.
     */
    async function callApi(action, patch) {
      const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...patch }),
      })
      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }
      if (!response.ok || payload === null || payload.ok !== true) {
        throw new Error(payload?.error ?? `HTTP ${response.status}`)
      }
      return payload.value
    }

    /**
     * Subscribe to locale changes so the page follows a language switch.
     * @param locale - the client locale service.
     * @returns the current lowercase locale id.
     */
    function useLocaleId(locale) {
      const [id, setId] = React.useState(() => localeId(locale))
      React.useEffect(() => {
        if (typeof locale?.subscribe !== 'function') return undefined
        return locale.subscribe(() => setId(localeId(locale)))
      }, [])
      return id
    }

    /**
     * Build the settings page component for one plugin instance.
     * @param locale - the client locale service.
     * @returns the page component.
     */
    function makePage(locale) {
      return function PromptInjectPage() {
        const t = stringsFor(useLocaleId(locale))
        const [view, setView] = React.useState(null)
        const [enabled, setEnabled] = React.useState(true)
        const [text, setText] = React.useState(DEFAULT_TEXT)
        const [busy, setBusy] = React.useState(false)
        const [error, setError] = React.useState(null)
        const [notice, setNotice] = React.useState(null)
        const mounted = React.useRef(true)

        React.useEffect(() => {
          mounted.current = true
          return () => {
            mounted.current = false
          }
        }, [])

        const load = React.useCallback(async () => {
          setBusy(true)
          setError(null)
          try {
            const value = await callApi('get')
            if (!mounted.current) return
            setView(value)
            setEnabled(value.enabled === true)
            setText(typeof value.text === 'string' ? value.text : DEFAULT_TEXT)
            setNotice(null)
          } catch (failure) {
            if (mounted.current) setError(`${t.loadFailed}: ${failure?.message ?? failure}`)
          } finally {
            if (mounted.current) setBusy(false)
          }
        }, [t])

        React.useEffect(() => {
          void load()
        }, [load])

        const dirty = view !== null && (enabled !== view.enabled || text !== view.text)
        const firstLine = text.split('\n')[0]

        const save = async () => {
          if (busy) return
          setBusy(true)
          setError(null)
          setNotice(null)
          try {
            const value = await callApi('save', { enabled, text })
            if (!mounted.current) return
            setView(value)
            setEnabled(value.enabled === true)
            setText(value.text)
            setNotice(t.saved)
          } catch (failure) {
            if (mounted.current) setError(`${t.saveFailed}: ${failure?.message ?? failure}`)
          } finally {
            if (mounted.current) setBusy(false)
          }
        }

        if (view === null) {
          return h('div', { style: styles.page },
            h('div', { style: styles.help }, busy ? t.loading : t.loadFailed),
            error !== null ? h('div', { style: styles.error, role: 'alert' }, error) : null,
            error !== null
              ? h('div', { style: styles.actions },
                h('button', { type: 'button', style: styles.button, onClick: () => void load() }, t.retry))
              : null,
          )
        }

        return h('div', { style: styles.page },
          h('div', { style: styles.row },
            h('div', { style: styles.switchRow },
              h('div', null,
                h('div', { style: styles.title }, t.switchLabel),
                h('div', { style: styles.help }, t.switchHelp)),
              h('input', {
                type: 'checkbox',
                role: 'switch',
                'aria-label': t.switchLabel,
                checked: enabled,
                disabled: busy,
                style: styles.switch,
                onChange: (event) => {
                  setEnabled(event.target.checked)
                  setNotice(null)
                },
              })),
            h('div', null,
              h('span', { style: styles.pill }, view.enabled ? t.stateOn : t.stateOff)),
          ),
          h('div', { style: styles.row },
            h('div', { style: styles.title }, t.textLabel),
            h('textarea', {
              value: text,
              disabled: busy,
              rows: 4,
              spellCheck: false,
              'aria-label': t.textLabel,
              style: styles.textarea,
              onChange: (event) => {
                setText(event.target.value)
                setNotice(null)
              },
            }),
            h('div', { style: styles.help }, t.textHelp),
            h('div', { style: styles.preview },
              h('div', { style: styles.help }, t.firstLine),
              h('div', null, enabled && firstLine.trim().length > 0 ? firstLine : t.emptyPreview)),
          ),
          h('div', { style: styles.actions },
            h('button', {
              type: 'button',
              style: dirty && !busy ? styles.primaryButton : { ...styles.primaryButton, opacity: '0.5' },
              disabled: busy || !dirty,
              onClick: () => void save(),
            }, busy ? t.saving : t.save),
            h('button', {
              type: 'button',
              style: styles.button,
              disabled: busy,
              onClick: () => {
                setText(DEFAULT_TEXT)
                setEnabled(true)
                setNotice(null)
              },
            }, t.reset),
            dirty && !busy
              ? h('button', {
                type: 'button',
                style: styles.button,
                onClick: () => {
                  setEnabled(view.enabled === true)
                  setText(view.text)
                  setNotice(null)
                  setError(null)
                },
              }, t.discard)
              : null,
            dirty && !busy ? h('span', { style: styles.help }, t.dirty) : null,
          ),
          notice !== null ? h('div', { style: styles.notice, role: 'status' }, notice) : null,
          error !== null ? h('div', { style: styles.error, role: 'alert' }, error) : null,
          h('div', { style: styles.footnote },
            h('span', { style: styles.mono }, `${t.fileLabel}: ${view.file}`)),
        )
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const locale = ctx.get('locale')
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: SECTION_ID,
          order: 26,
          label: () => stringsFor(localeId(locale)).nav,
        }, makePage(locale)))
      },
    }
  },
})
