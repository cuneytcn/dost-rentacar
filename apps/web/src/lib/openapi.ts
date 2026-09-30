import { OpenApiGeneratorV31, OpenAPIRegistry, type RouteConfig } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import {
  availabilityItemSchema,
  availabilityQuerySchema,
  corporateRequestInputSchema,
  createReservationRequestSchema,
  errorResponseSchema,
  extraSchema,
  localeSchema,
  locationSchema,
  publicSettingsSchema,
  quoteRequestSchema,
  quoteSchema,
  reservationCancelRequestSchema,
  reservationLookupRequestSchema,
  reservationSummarySchema,
  vehicleCategorySchema,
  vehicleModelDetailSchema,
  vehicleModelListQuerySchema,
  vehicleModelSummarySchema,
} from '@rent/shared'

const registry = new OpenAPIRegistry()

/** Registers a reusable component via zod metadata (no global zod patching needed). */
const named = <T extends z.ZodType>(id: string, schema: T): T => schema.meta({ id }) as T

const dataOf = <T extends z.ZodType>(schema: T) => z.object({ data: schema })
const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
})

const ErrorResponse = named('ErrorResponse', errorResponseSchema)
const errors: RouteConfig['responses'] = {
  400: json(ErrorResponse, 'Invalid request'),
  404: json(ErrorResponse, 'Not found'),
  409: json(ErrorResponse, 'Not available / conflict'),
  422: json(ErrorResponse, 'Booking rules violated'),
}

const Location = named('Location', locationSchema)
const VehicleCategory = named('VehicleCategory', vehicleCategorySchema)
const VehicleModelSummary = named('VehicleModelSummary', vehicleModelSummarySchema)
const VehicleModelDetail = named('VehicleModelDetail', vehicleModelDetailSchema)
const Extra = named('Extra', extraSchema)
const PublicSettings = named('PublicSettings', publicSettingsSchema)
const Quote = named('Quote', quoteSchema)
const AvailabilityItem = named('AvailabilityItem', availabilityItemSchema)
const ReservationSummary = named('ReservationSummary', reservationSummarySchema)

const localeQuery = z.object({ locale: localeSchema.optional() })
const violationsSchema = z.array(z.object({ code: z.string() }).catchall(z.unknown()))

registry.registerPath({
  method: 'get',
  path: '/api/v1/locations',
  summary: 'Active locations (branches)',
  request: { query: localeQuery },
  responses: { 200: json(dataOf(z.array(Location)), 'Locations') },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/vehicle-categories',
  summary: 'Vehicle categories',
  request: { query: localeQuery },
  responses: { 200: json(dataOf(z.array(VehicleCategory)), 'Categories') },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/vehicle-models',
  summary: 'Vehicle catalog',
  request: { query: localeQuery.extend(vehicleModelListQuerySchema.shape) },
  responses: { 200: json(dataOf(z.array(VehicleModelSummary)), 'Vehicle models') },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/vehicle-models/{slug}',
  summary: 'Vehicle model detail',
  request: { params: z.object({ slug: z.string() }), query: localeQuery },
  responses: { 200: json(dataOf(VehicleModelDetail), 'Vehicle model'), ...errors },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/extras',
  summary: 'Optional extras',
  request: { query: localeQuery },
  responses: { 200: json(dataOf(z.array(Extra)), 'Extras') },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/settings',
  summary: 'Public company settings, currencies, bank accounts and booking rules',
  request: { query: localeQuery },
  responses: { 200: json(dataOf(PublicSettings), 'Settings') },
})
registry.registerPath({
  method: 'get',
  path: '/api/v1/availability',
  summary: 'Availability and prices of all models for a rental window',
  request: { query: availabilityQuerySchema },
  responses: { 200: json(dataOf(z.array(AvailabilityItem)), 'Availability'), ...errors },
})
registry.registerPath({
  method: 'post',
  path: '/api/v1/quotes',
  summary: 'Price one model with extras',
  request: { query: localeQuery, body: { content: { 'application/json': { schema: quoteRequestSchema } } } },
  responses: { 200: json(dataOf(z.object({ quote: Quote, violations: violationsSchema })), 'Quote'), ...errors },
})
registry.registerPath({
  method: 'post',
  path: '/api/v1/reservations',
  summary: 'Create a reservation request (status: pending)',
  request: { body: { content: { 'application/json': { schema: createReservationRequestSchema } } } },
  responses: { 201: json(dataOf(ReservationSummary), 'Created'), 403: json(ErrorResponse, 'Captcha failed'), ...errors },
})
registry.registerPath({
  method: 'post',
  path: '/api/v1/reservations/lookup',
  summary: 'Find a reservation by code and email',
  request: { query: localeQuery, body: { content: { 'application/json': { schema: reservationLookupRequestSchema } } } },
  responses: { 200: json(dataOf(ReservationSummary), 'Reservation'), ...errors },
})
registry.registerPath({
  method: 'post',
  path: '/api/v1/reservations/cancel',
  summary: 'Cancel a reservation (before the cancellation cutoff)',
  request: { query: localeQuery, body: { content: { 'application/json': { schema: reservationCancelRequestSchema } } } },
  responses: { 200: json(dataOf(ReservationSummary), 'Cancelled'), ...errors },
})
registry.registerPath({
  method: 'post',
  path: '/api/v1/corporate-requests',
  summary: 'Submit a corporate / long-term rental request',
  request: { body: { content: { 'application/json': { schema: corporateRequestInputSchema } } } },
  responses: { 201: json(dataOf(z.object({ id: z.number().int() })), 'Created'), 403: json(ErrorResponse, 'Captcha failed'), ...errors },
})

export function buildOpenApiDocument(serverUrl: string) {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Rent a Car API',
      version: '1.0.0',
      description: 'Public API used by the website and mobile apps. Money values are integer minor units.',
    },
    servers: [{ url: serverUrl }],
  })
}
