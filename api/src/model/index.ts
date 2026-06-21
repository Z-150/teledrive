import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

prisma.$use(async (params, next) => {
  if (params.model === 'files') {
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data && params.args.data.sharing_options !== undefined) {
        if (Array.isArray(params.args.data.sharing_options)) {
          params.args.data.sharing_options = JSON.stringify(params.args.data.sharing_options)
        }
      }
    }
    if (params.action === 'updateMany' || params.action === 'createMany') {
      if (params.args.data) {
        const dataArray = Array.isArray(params.args.data) ? params.args.data : [params.args.data]
        for (const item of dataArray) {
          if (item.sharing_options !== undefined && Array.isArray(item.sharing_options)) {
            item.sharing_options = JSON.stringify(item.sharing_options)
          }
        }
      }
    }
  }

  const result = await next(params)

  if (params.model === 'files') {
    if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'create' || params.action === 'update') {
      if (result && typeof result.sharing_options === 'string') {
        try {
          result.sharing_options = JSON.parse(result.sharing_options)
        } catch (e) { /* ignore */ }
      }
    }
    if (params.action === 'findMany' || params.action === 'updateMany' || params.action === 'createMany') {
      if (Array.isArray(result)) {
        for (const file of result) {
          if (file && typeof file.sharing_options === 'string') {
            try {
              file.sharing_options = JSON.parse(file.sharing_options)
            } catch (e) { /* ignore */ }
          }
        }
      }
    }
  }
  return result
})