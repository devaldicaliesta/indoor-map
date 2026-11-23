# Graph Report - indoor-map  (2026-11-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 9858 nodes · 31656 edges · 336 communities (248 shown, 88 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 490 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `33be976b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209
- Community 210
- Community 211
- Community 212
- Community 213
- Community 214
- Community 215
- Community 216
- Community 217
- Community 218
- Community 219
- Community 220
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 239
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 250
- Community 251
- Community 252
- Community 254
- Community 255
- Community 257
- Community 258
- Community 259
- Community 260
- Community 261
- Community 262
- Community 263
- Community 264
- Community 265
- Community 266
- Community 267
- Community 271
- Community 274
- Community 275
- Community 276
- Community 277
- Community 278
- Community 279
- Community 280
- Community 284

## God Nodes (most connected - your core abstractions)
1. `Button()` - 348 edges
2. `VenueId` - 245 edges
3. `cn()` - 148 edges
4. `Input()` - 142 edges
5. `test` - 127 edges
6. `toDataError()` - 119 edges
7. `createRepositories()` - 113 edges
8. `FormNotice()` - 107 edges
9. `DialogHeader()` - 102 edges
10. `DialogTitle()` - 102 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `retry()` --indirect_call--> `token()`  [INFERRED]
  apps/landing/src/trial/verify-page.tsx → scripts/demo-screens.mjs

## Import Cycles
- None detected.

## Communities (336 total, 88 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (45): FOOTPRINT, linkUnitsToPath(), PublishedVenue, test, TEST_CENTER, TestVenue, unitSquare(), AdminShell (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (105): createRepositories(), CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, TablesInsert, createInstructionTemplatesRepository() (+97 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (135): Field(), others, TimezoneSelect(), VenuePicker(), ROLE_LABELS, AREA_KINDS, targetKey(), TargetPicker() (+127 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (144): UiGalleryPage(), aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), CompletenessSection(), Dashboard(), Figure(), LocationsSection() (+136 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (118): submit(), haversineM(), Geometry, SnapshotGraph, SnapshotPosition, EditableFeature, ARC_ACCESSIBLE, ARC_CONNECTOR (+110 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (119): ColorField(), isColorValue(), useVenueSelection, venuesKey, AliasField(), FormNotice(), ForgotPasswordPage(), ConnectorDialog() (+111 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (106): Tables, TablesUpdate, CODE_RULES, CodeRule, DataError, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES (+98 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (94): BrandGallery(), Section(), SURFACES, TEXT_PAIRS, TOKENS, AccountMenu(), AppLayout(), NarrowScreenNotice() (+86 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (107): useCurrentProfile(), inVenueTime(), HomeRedirect(), INSTALLATION_MODULES, ModulePage(), ModuleRoute(), PlaceholderPage(), describe() (+99 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (116): InsertedVenue, LocationPlace, Place, SnapshotIndex, OutdoorSubtype, hasOpeningHours(), ImportWrite, INFO_POINT_ZOOM (+108 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (47): RFC-6238, env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId() (+39 more)

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (91): CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, formFloorIds(), FormPlace, levelOf(), BUILDINGS, FLOORS, g (+83 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (80): page, vite-plugin-pwa@catalog:, diagnoseWriteRejection(), sql(), json(), read(), results, root (+72 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (69): seedPublishHistory(), envFile, VENUES, SnapshotPolygon, CONTEXT, VENUES, AIRLINES, airportVenue() (+61 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (79): API_COUNT_LABELS, AUDIT_LABELS, BULK_KINDS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel() (+71 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (97): COLUMNS, DataTableGallery(), date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES (+89 more)

### Community 16 - "Community 16"
Cohesion: 0.03
Nodes (80): Draft, BulkEditRow, createLocationBulkEditsRepository(), get(), LocationBulkEditsRepository, mapBulkEditRow(), createLocationTypesRepository(), FieldRow (+72 more)

### Community 17 - "Community 17"
Cohesion: 0.03
Nodes (78): base, closure(), snapshot, highlightBounds(), targetOfPick(), facility, index, snapshot (+70 more)

### Community 18 - "Community 18"
Cohesion: 0.04
Nodes (84): FeatureKind, MapFeatureProperties, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, EDIT_COLORS, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL (+76 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (77): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, AuthLayout(), ACTIVITY_EVENTS, clearActivity() (+69 more)

### Community 20 - "Community 20"
Cohesion: 0.03
Nodes (35): VenueSelection, DataClient, AliasesRepository, aliasKey(), AliasRow, createAliasesRepository(), groupAliasRows(), ConnectorsRepository (+27 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (67): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+59 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (71): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+63 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (65): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), attachAt(), clamp01(), closestBetween() (+57 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (69): addYear(), dayStart(), fail(), isoSeconds(), JAKARTA_DAY, jakartaDayStart(), LicenseIssueCheck, LicenseIssueContext (+61 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (61): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+53 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (58): move(), CategoriesRepository, CategoryRow, createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload() (+50 more)

### Community 28 - "Community 28"
Cohesion: 0.04
Nodes (51): Database, FeatureProps, FeatureRow, finiteNumber(), FloorFeatures, mapFeatureRow(), modelProps(), propsOf() (+43 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (70): signedLicense(), paidLicense(), canonicalize(), fromBase64(), importLicensePublicKey(), isCount(), isDate(), isText() (+62 more)

### Community 30 - "Community 30"
Cohesion: 0.05
Nodes (63): EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+55 more)

### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (35): Entry, GraphSaveQueueOptions, deferred(), setup(), venue, ACTIVITY_EVENTS, EditLockState, ConnectorInput (+27 more)

### Community 32 - "Community 32"
Cohesion: 0.05
Nodes (67): exportMap(), save(), slug(), download(), boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf() (+59 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (60): PanelMessage(), NON_RETRYABLE, queryClient, useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea() (+52 more)

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (63): ClosureMarkData, closureMarks(), useClosureMap(), Placed, useEventMap(), CameraPadding, fitBearing(), focusCamera() (+55 more)

### Community 35 - "Community 35"
Cohesion: 0.04
Nodes (49): app.user_role(), audit_events_occurred_idx, public.audit_events, public.edit_locks, public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes() (+41 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (55): closureTargetAt(), interceptCanvasClick(), PlanBackground, Corners, attributed, Basemap, BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID (+47 more)

### Community 37 - "Community 37"
Cohesion: 0.04
Nodes (72): @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/react@catalog:, @vitejs/plugin-react@catalog:, @indoor/third-party-notices, tailwindcss, @tailwindcss/vite (+64 more)

### Community 38 - "Community 38"
Cohesion: 0.04
Nodes (39): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, COORDINATE_DECIMALS, createFeatureEditor(), onClick() (+31 more)

### Community 39 - "Community 39"
Cohesion: 0.04
Nodes (70): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, react@catalog: (+62 more)

### Community 40 - "Community 40"
Cohesion: 0.04
Nodes (18): EventSave, Fixtures, VisitorPage, createVariedVenues(), specs(), shot(), visitorSearch(), TILE_PNG (+10 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (61): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), AdminTourButton(), LABELS, seenKey (+53 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (55): BasemapUrlProblem, escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES (+47 more)

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (45): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+37 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (52): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, InstructionAction (+44 more)

### Community 45 - "Community 45"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 46 - "Community 46"
Cohesion: 0.08
Nodes (51): eventPositions(), featureName(), featureView(), OriginView, originView(), placeOfTarget(), index, snapshot (+43 more)

### Community 47 - "Community 47"
Cohesion: 0.06
Nodes (36): ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+28 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (57): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+49 more)

### Community 49 - "Community 49"
Cohesion: 0.08
Nodes (51): floorLabel(), useVenueFloors(), InfoPointDialog(), InfoPointDialogTarget, submit(), Places, PROBLEMS, InfoPointsPanel() (+43 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (48): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+40 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (46): GraphLayer(), graphViews(), neighbourPositions(), NO_STATUS, NODE_ROLE_LABELS, createGraphInteractions(), onMove(), onUp() (+38 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (52): BUILDING_SIZES, BUILDING_TYPES, CSV_LABELS, date, dateTime, formatDate(), REJECT_REASONS, STAGES (+44 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (38): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.features, public.field_definitions, public.location_categories (+30 more)

### Community 54 - "Community 54"
Cohesion: 0.05
Nodes (30): globalSetup(), ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary() (+22 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (26): appServers, args, CI, projectArgs, capture(), shot(), createFullVenue(), Db (+18 more)

### Community 56 - "Community 56"
Cohesion: 0.06
Nodes (49): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+41 more)

### Community 57 - "Community 57"
Cohesion: 0.07
Nodes (44): EulaChoice, InstanceId(), ManualForm(), OnlineForm(), STATE_NOTICE, TrialForm(), Banner(), CheckinNotice() (+36 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (46): API_SCOPE_LABELS, API_SCOPES, API_UPSERT_MAX, ApiClosureInput, ApiHoursRow, ApiLocationUpsert, ApiParse, ApiScope (+38 more)

### Community 59 - "Community 59"
Cohesion: 0.07
Nodes (38): opening_hours_location_idx, public.opening_hours, app.api_key_check(), app.api_spans(), app.check_venue_list(), app.check_webhook_input(), app.webhook_flush(), app.webhook_on_location() (+30 more)

### Community 60 - "Community 60"
Cohesion: 0.09
Nodes (45): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+37 more)

### Community 61 - "Community 61"
Cohesion: 0.05
Nodes (24): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, createAuthRepository() (+16 more)

### Community 62 - "Community 62"
Cohesion: 0.06
Nodes (40): createMediaRepository(), list(), IMAGE_EXTENSIONS, isBucket(), mapMediaRow(), MediaRepository, MediaRow, usagesOf() (+32 more)

### Community 63 - "Community 63"
Cohesion: 0.07
Nodes (27): hosting.vendor_actions, vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create(), public.vendor_license_record() (+19 more)

### Community 64 - "Community 64"
Cohesion: 0.07
Nodes (31): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+23 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (28): DataClientConfig, AnalyticsConfig, AnalyticsRepository, createAnalyticsRepository(), DISABLED, createCadConverterRepository(), post(), createEditLocksRepository() (+20 more)

### Community 66 - "Community 66"
Cohesion: 0.05
Nodes (45): @indoor/data@workspace:*, pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog: (+37 more)

### Community 67 - "Community 67"
Cohesion: 0.05
Nodes (45): @types/react-dom, @types/react-dom@catalog:, @types/react-dom@catalog:, @types/react-dom@catalog:, dependencies, class-variance-authority@catalog:, clsx@catalog:, driver.js@catalog: (+37 more)

### Community 68 - "Community 68"
Cohesion: 0.06
Nodes (19): SheetSnap, createExploreStore(), ExploreList, ExploreState, FocusMode, INITIAL, InitialExplore, initialState() (+11 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (29): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+21 more)

### Community 70 - "Community 70"
Cohesion: 0.08
Nodes (30): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, useVisitorTour(), infoPointTour(), ShowSheet, venueTour(), useExplorerTour() (+22 more)

### Community 71 - "Community 71"
Cohesion: 0.08
Nodes (42): stringList(), toLicenseKey(), isCount(), jakartaDay(), readQuota(), ActivationCheck, ActivationRequest, checkActivationRequest() (+34 more)

### Community 72 - "Community 72"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 73 - "Community 73"
Cohesion: 0.10
Nodes (35): copy(), Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date (+27 more)

### Community 74 - "Community 74"
Cohesion: 0.13
Nodes (35): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+27 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (23): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+15 more)

### Community 76 - "Community 76"
Cohesion: 0.19
Nodes (35): ContrastTable(), readToken(), PreviewTable(), BackupHistory(), formatDateTime(), CheckinsDialog(), History(), ClientsPanel() (+27 more)

### Community 77 - "Community 77"
Cohesion: 0.13
Nodes (32): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, ClosurePlaces, fromVenueInput(), impactText(), offsetMs() (+24 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 80 - "Community 80"
Cohesion: 0.11
Nodes (27): CLOSURE_REFRESH_MS, useCurrentClosures(), useVenueGraph(), venueGraphKey(), NONE, NOTHING_CLOSED, otherFloors(), useGraphStatus() (+19 more)

### Community 81 - "Community 81"
Cohesion: 0.12
Nodes (29): choose(), createForUnit(), editorQueues(), graphSaveQueue(), pickFacilityTypeId(), PropertiesPatch, saveQueue(), SHAPE_OF (+21 more)

### Community 82 - "Community 82"
Cohesion: 0.09
Nodes (29): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+21 more)

### Community 83 - "Community 83"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 85 - "Community 85"
Cohesion: 0.06
Nodes (35): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+27 more)

### Community 86 - "Community 86"
Cohesion: 0.08
Nodes (31): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+23 more)

### Community 87 - "Community 87"
Cohesion: 0.07
Nodes (22): app.trial_venue(), hosting.trials, app.venue_locked(), hosting.blocklist, hosting.trial_requests, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+14 more)

### Community 88 - "Community 88"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 89 - "Community 89"
Cohesion: 0.11
Nodes (29): SnapshotConnector, SnapshotNavEdge, SnapshotNavNode, Network, at(), FLOORS, graphOf(), at() (+21 more)

### Community 90 - "Community 90"
Cohesion: 0.11
Nodes (29): RouteGraphStatus, nearestTarget(), ExploreContext, ExploreData, ExploreProvider(), loadSearch(), NO_STOPS, routeCache() (+21 more)

### Community 91 - "Community 91"
Cohesion: 0.15
Nodes (24): VenueSpec, fieldKeyFromLabel(), airportStation, campus, custom, factoryWarehouse, hospital, hours (+16 more)

### Community 92 - "Community 92"
Cohesion: 0.10
Nodes (28): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+20 more)

### Community 93 - "Community 93"
Cohesion: 0.11
Nodes (27): PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, AnalyticsQueue, choice, choosePrivacy(), listeners (+19 more)

### Community 94 - "Community 94"
Cohesion: 0.11
Nodes (29): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+21 more)

### Community 95 - "Community 95"
Cohesion: 0.10
Nodes (28): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), customFieldInput(), CustomFieldProblem, customFieldsSchema(), FIELD_LABEL_MAX (+20 more)

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 97 - "Community 97"
Cohesion: 0.07
Nodes (32): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+24 more)

### Community 98 - "Community 98"
Cohesion: 0.11
Nodes (28): DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER, OUTDOOR_FILTER (+20 more)

### Community 99 - "Community 99"
Cohesion: 0.12
Nodes (29): MapLabel, hasLocationIcon, kind, LABEL_LAYER_ID, LABEL_SOURCE_ID, labelCollection(), setLabels(), canvas2d() (+21 more)

### Community 100 - "Community 100"
Cohesion: 0.10
Nodes (26): LibraryModel, MODEL_BASE_HEIGHT, MODEL_SCALE, parseModelRef(), three@catalog:, createModelsLayer(), rebuild(), report() (+18 more)

### Community 101 - "Community 101"
Cohesion: 0.15
Nodes (28): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+20 more)

### Community 102 - "Community 102"
Cohesion: 0.08
Nodes (13): EditorState, Direction, CONNECTOR_KINDS, CONNECTOR_NAME_MAX, ConnectorFloor, ConnectorProblem, ESCALATOR_DIRECTIONS, GraphPatch (+5 more)

### Community 103 - "Community 103"
Cohesion: 0.11
Nodes (25): geometryOf(), RouteLayer(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), appliedColors, feature() (+17 more)

### Community 104 - "Community 104"
Cohesion: 0.15
Nodes (30): canvasArea(), connectorColor(), drawPlan(), strokeRoute(), deskAndMonitor(), LOBBY, lobby(), screenQuad() (+22 more)

### Community 105 - "Community 105"
Cohesion: 0.11
Nodes (22): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineStringSchema, MultiPolygonSchema, PointSchema (+14 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (25): featurePosition(), endPlace(), endTarget(), featureAt(), SharedState, sharedState(), facility, index (+17 more)

### Community 107 - "Community 107"
Cohesion: 0.12
Nodes (24): RFC-2045, RFC-2387, addressOf(), Attachment, attachmentPart(), base64(), base64Lines(), bodyPart() (+16 more)

### Community 108 - "Community 108"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 109 - "Community 109"
Cohesion: 0.13
Nodes (24): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+16 more)

### Community 110 - "Community 110"
Cohesion: 0.13
Nodes (25): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+17 more)

### Community 111 - "Community 111"
Cohesion: 0.18
Nodes (22): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+14 more)

### Community 112 - "Community 112"
Cohesion: 0.13
Nodes (24): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, mapDisplaySettingsRow(), Branding, CameraView, CameraViewSchema (+16 more)

### Community 113 - "Community 113"
Cohesion: 0.19
Nodes (24): data, EventDetail(), EventList(), EventRow(), KindBadge(), LiveBadge(), LocationEvents(), Section() (+16 more)

### Community 114 - "Community 114"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 115 - "Community 115"
Cohesion: 0.15
Nodes (19): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+11 more)

### Community 116 - "Community 116"
Cohesion: 0.18
Nodes (23): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+15 more)

### Community 117 - "Community 117"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 118 - "Community 118"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 119 - "Community 119"
Cohesion: 0.11
Nodes (25): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, analyticsCsv(), analyticsDays() (+17 more)

### Community 120 - "Community 120"
Cohesion: 0.14
Nodes (24): addYear(), EVENT_LIMITS, EVENT_PHASE_LABELS, EVENT_REPEATS, EVENT_SOON_DAYS, EVENT_STATUS_LABELS, EVENT_STATUSES, EventInputErrors (+16 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (24): roomGeometry(), Box, boxesOverlap(), boxOf(), clipConvex(), cross(), distanceToRing(), distanceToSegment() (+16 more)

### Community 122 - "Community 122"
Cohesion: 0.13
Nodes (25): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+17 more)

### Community 123 - "Community 123"
Cohesion: 0.13
Nodes (20): VersionState(), EMPTY, ReleasesPanel(), todayInJakarta(), failed(), keys, useReleaseActions(), useReleases() (+12 more)

### Community 124 - "Community 124"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 125 - "Community 125"
Cohesion: 0.12
Nodes (20): confidenceLevel(), isPositive(), pixelToLngLat(), PlanCorners, readObject(), readScanResult(), SCAN_CONFIDENCE_LABELS, SCAN_MIN_ROOM_M2 (+12 more)

### Community 126 - "Community 126"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 127 - "Community 127"
Cohesion: 0.14
Nodes (21): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+13 more)

### Community 128 - "Community 128"
Cohesion: 0.11
Nodes (16): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+8 more)

### Community 129 - "Community 129"
Cohesion: 0.17
Nodes (19): colorNotes(), channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI (+11 more)

### Community 130 - "Community 130"
Cohesion: 0.09
Nodes (24): @biomejs/biome, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/*, ./license (+16 more)

### Community 131 - "Community 131"
Cohesion: 0.15
Nodes (18): ConnectorDialogState, useConnectorDialog, ConnectorDetails(), ConnectorPanel(), DIRECTION_LABELS, stopNames(), connectorsKey(), syncStop() (+10 more)

### Community 132 - "Community 132"
Cohesion: 0.18
Nodes (18): FacilityIconPreview(), choiceSource(), FILE_MESSAGES, IconField(), pickFile(), iconSource(), ICON_RASTER_PX, rasterizeIcon() (+10 more)

### Community 133 - "Community 133"
Cohesion: 0.15
Nodes (21): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+13 more)

### Community 134 - "Community 134"
Cohesion: 0.16
Nodes (17): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), useSnapshot(), Prefetch, PrefetchHolder (+9 more)

### Community 135 - "Community 135"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 136 - "Community 136"
Cohesion: 0.11
Nodes (13): ScanPreviewLayer(), EMPTY, ScanState, LineString, ScanCandidate, ScanCandidates, ScanConfidenceLevel, removePreview() (+5 more)

### Community 137 - "Community 137"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 138 - "Community 138"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, exports, ./testing/full-venue, ./testing/large-venue (+14 more)

### Community 139 - "Community 139"
Cohesion: 0.10
Nodes (22): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog:, vitest@catalog: (+14 more)

### Community 140 - "Community 140"
Cohesion: 0.12
Nodes (17): applyGraphPatch(), apply(), BASE, degree(), draw(), edgeList(), EMPTY, expectValid() (+9 more)

### Community 141 - "Community 141"
Cohesion: 0.18
Nodes (19): settings, toFormValues(), toPatch(), validate(), cameraSummary(), ColorRow(), DisplayForm(), submit() (+11 more)

### Community 142 - "Community 142"
Cohesion: 0.19
Nodes (18): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+10 more)

### Community 143 - "Community 143"
Cohesion: 0.13
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.mfa_required_roles(), system_settings_guard_mfa, analytics_events_time, analytics_events_venue_time (+7 more)

### Community 144 - "Community 144"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 145 - "Community 145"
Cohesion: 0.16
Nodes (14): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+6 more)

### Community 146 - "Community 146"
Cohesion: 0.14
Nodes (19): expected(), expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue(), Db (+11 more)

### Community 147 - "Community 147"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 148 - "Community 148"
Cohesion: 0.13
Nodes (17): ENTRIES, Entry, HAYSTACKS, info(), isPictogramKey(), KEY_SET, PICTOGRAM_CATEGORIES, PICTOGRAM_CATEGORY_LABELS (+9 more)

### Community 149 - "Community 149"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 150 - "Community 150"
Cohesion: 0.12
Nodes (15): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+7 more)

### Community 151 - "Community 151"
Cohesion: 0.19
Nodes (16): LicenseDialog(), LicensePanel(), RevokeConfirm(), STATUS, todayInJakarta(), downloadLicense(), failed(), keys (+8 more)

### Community 152 - "Community 152"
Cohesion: 0.25
Nodes (19): bench(), box(), BUILDERS, busStop(), COLORS, cylinder(), elevator(), escalator() (+11 more)

### Community 153 - "Community 153"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 154 - "Community 154"
Cohesion: 0.19
Nodes (7): SaveState, SaveOp, SaveQueue, SaveQueueOptions, SaveStatus, deferred(), setup()

### Community 155 - "Community 155"
Cohesion: 0.17
Nodes (17): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+9 more)

### Community 156 - "Community 156"
Cohesion: 0.18
Nodes (16): BrandingFormErrors, BrandingFormValues, ColorNote, MESSAGES, ratio, BRANDING_KEYS, BrandingInput, brandingJson() (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 158 - "Community 158"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 159 - "Community 159"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 160 - "Community 160"
Cohesion: 0.12
Nodes (18): typescript, dependencies, @indoor/domain@workspace:*, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+10 more)

### Community 161 - "Community 161"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 162 - "Community 162"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 163 - "Community 163"
Cohesion: 0.15
Nodes (16): accepted(), claim(), logError(), NoticeRow, release(), text(), serviceHeaders, SmtpRow (+8 more)

### Community 164 - "Community 164"
Cohesion: 0.12
Nodes (18): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+10 more)

### Community 165 - "Community 165"
Cohesion: 0.13
Nodes (16): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+8 more)

### Community 166 - "Community 166"
Cohesion: 0.22
Nodes (14): livePreview(), empty, toBrandingFormValues(), validateBranding(), BrandingForm(), submit(), LogoDraft, LogoField() (+6 more)

### Community 167 - "Community 167"
Cohesion: 0.24
Nodes (13): home(), LanguageSwitch(), MobileMenu(), privacyPage(), SiteFooter(), SiteHeader(), PrivacyPage(), apply() (+5 more)

### Community 168 - "Community 168"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 169 - "Community 169"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 170 - "Community 170"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 171 - "Community 171"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 172 - "Community 172"
Cohesion: 0.28
Nodes (13): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+5 more)

### Community 173 - "Community 173"
Cohesion: 0.21
Nodes (14): useDocumentMeta(), OUTCOMES, pending, postVerify(), RequestResult, retryVerify(), VerifyResult, verifyTrial() (+6 more)

### Community 174 - "Community 174"
Cohesion: 0.29
Nodes (13): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+5 more)

### Community 175 - "Community 175"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 176 - "Community 176"
Cohesion: 0.18
Nodes (13): checkGlb(), checkModelPlacement(), GLB_MIME, GLB_PROBLEM_MESSAGES, GlbProblem, inRange(), latin1(), MAX_GLB_BYTES (+5 more)

### Community 177 - "Community 177"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 178 - "Community 178"
Cohesion: 0.15
Nodes (10): FloorValidation, useFloorValidation(), MultiPolygon, issuesByFeature(), ValidatedFeature, ValidationIssue, boundary, features (+2 more)

### Community 179 - "Community 179"
Cohesion: 0.28
Nodes (13): FloorPlanVersion, key(), listWithUrls(), useFloorPlans(), useUploadFloorPlan(), candidateLabels(), CandidateList(), KIND_LABELS (+5 more)

### Community 180 - "Community 180"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 181 - "Community 181"
Cohesion: 0.21
Nodes (10): PictogramKey, TemplateCategory, TemplateFacilityType, TemplateLocationType, LIBRARY_SHAPES, LUCIDE_VERSION, partAttributes(), LEGACY_SHAPES (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.14
Nodes (5): VendorClientsRepository, VendorLicense, VendorTrialRequest, VendorClient, VendorInstallation

### Community 183 - "Community 183"
Cohesion: 0.24
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 184 - "Community 184"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 185 - "Community 185"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 186 - "Community 186"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 187 - "Community 187"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 189 - "Community 189"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 190 - "Community 190"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 191 - "Community 191"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 192 - "Community 192"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 193 - "Community 193"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 194 - "Community 194"
Cohesion: 0.35
Nodes (9): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), RFC-4180, guessDelimiter(), parseCsv(), toCsv() (+1 more)

### Community 195 - "Community 195"
Cohesion: 0.38
Nodes (9): columnIndex(), columnName(), escapeXml(), firstSheetPath(), readXlsx(), texts(), unescapeXml(), writeXlsx() (+1 more)

### Community 196 - "Community 196"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 197 - "Community 197"
Cohesion: 0.18
Nodes (6): DYNAMIC_PREFIXES, flatten(), languages, sources, Tree, usedKeys

### Community 198 - "Community 198"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 199 - "Community 199"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 200 - "Community 200"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 201 - "Community 201"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 202 - "Community 202"
Cohesion: 0.38
Nodes (6): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName(), ROUTE_COLOR

### Community 203 - "Community 203"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 204 - "Community 204"
Cohesion: 0.33
Nodes (7): createVenueDashboardRepository(), VenueDashboardRepository, count(), parseVenueDashboard(), record(), text(), VenueDashboard

### Community 205 - "Community 205"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 206 - "Community 206"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 207 - "Community 207"
Cohesion: 0.22
Nodes (9): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, @types/react-dom@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, vite (+1 more)

### Community 208 - "Community 208"
Cohesion: 0.36
Nodes (6): failure, useMapAvailable(), detectWebGL(), supportsWebGL(), WebGLProbeCanvas, canvas()

### Community 209 - "Community 209"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 210 - "Community 210"
Cohesion: 0.33
Nodes (5): ReceivedWebhook, signatureValid(), startWebhookReceiver(), shot(), visitorLabel()

### Community 211 - "Community 211"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 212 - "Community 212"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 213 - "Community 213"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 214 - "Community 214"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 215 - "Community 215"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 216 - "Community 216"
Cohesion: 0.25
Nodes (4): context, existing, header, type

### Community 217 - "Community 217"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 218 - "Community 218"
Cohesion: 0.48
Nodes (6): Calibration(), GeoreferencePanel(), meters, NumberField(), commit(), parseDecimal()

### Community 219 - "Community 219"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 221 - "Community 221"
Cohesion: 0.38
Nodes (6): LicenseKeysPanel(), NewKey(), failed(), keys, useLicenseKeyActions(), useLicenseKeys()

### Community 222 - "Community 222"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 226 - "Community 226"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 227 - "Community 227"
Cohesion: 0.33
Nodes (4): pdfText(), download(), evidence(), pdfText()

### Community 228 - "Community 228"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 229 - "Community 229"
Cohesion: 0.33
Nodes (6): DAYS, dryRun, [file, ...flags], parseCsv(), text, usage()

### Community 230 - "Community 230"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 231 - "Community 231"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 232 - "Community 232"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 233 - "Community 233"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 234 - "Community 234"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 235 - "Community 235"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 236 - "Community 236"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 237 - "Community 237"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 238 - "Community 238"
Cohesion: 0.33
Nodes (4): c, h, k, r

### Community 239 - "Community 239"
Cohesion: 0.33
Nodes (6): scripts, lint, perf, seed, test, typecheck

### Community 240 - "Community 240"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 241 - "Community 241"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 242 - "Community 242"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 243 - "Community 243"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 244 - "Community 244"
Cohesion: 0.60
Nodes (4): BrandingPreview(), CHIPS, Mark(), RouteSketch()

### Community 245 - "Community 245"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 246 - "Community 246"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 247 - "Community 247"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 248 - "Community 248"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 249 - "Community 249"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `RFC-2045`, `RFC-2387`, `TARGETS`, `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2871 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **88 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 50` to `Community 33`, `Community 2`, `Community 34`, `Community 5`, `Community 70`, `Community 7`, `Community 39`, `Community 174`, `Community 46`, `Community 113`, `Community 23`, `Community 93`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `RFC-2045`, `RFC-2387` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.031198686371100164 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 5` to `Community 2`, `Community 3`, `Community 131`, `Community 132`, `Community 7`, `Community 8`, `Community 141`, `Community 142`, `Community 15`, `Community 19`, `Community 151`, `Community 155`, `Community 30`, `Community 33`, `Community 166`, `Community 167`, `Community 41`, `Community 43`, `Community 173`, `Community 46`, `Community 49`, `Community 50`, `Community 179`, `Community 52`, `Community 57`, `Community 64`, `Community 73`, `Community 76`, `Community 77`, `Community 218`, `Community 92`, `Community 221`, `Community 94`, `Community 93`, `Community 103`, `Community 111`, `Community 113`, `Community 244`, `Community 116`, `Community 123`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02963258255265431 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 20` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 131`, `Community 5`, `Community 132`, `Community 134`, `Community 8`, `Community 6`, `Community 9`, `Community 11`, `Community 140`, `Community 141`, `Community 14`, `Community 15`, `Community 16`, `Community 13`, `Community 146`, `Community 23`, `Community 24`, `Community 27`, `Community 28`, `Community 31`, `Community 32`, `Community 33`, `Community 166`, `Community 41`, `Community 43`, `Community 44`, `Community 49`, `Community 52`, `Community 54`, `Community 188`, `Community 61`, `Community 62`, `Community 65`, `Community 204`, `Community 77`, `Community 80`, `Community 81`, `Community 91`, `Community 93`, `Community 94`, `Community 106`, `Community 112`, `Community 113`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04215966272269822 - nodes in this community are weakly interconnected._