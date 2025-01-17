import path from "node:path"
import process from 'node:process'
import { createLogger } from '~/src/server/common/helpers/logging/logger.js'
import { startServer } from '~/src/server/common/helpers/start-server.js'

const exampleFormFile = new URL('./forms/forms.json', import.meta.url).pathname

await startServer({
  formFileName: path.basename(exampleFormFile),
  formFilePath: path.dirname(exampleFormFile)
})

process.on('unhandledRejection', (error) => {
  const logger = createLogger()
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
