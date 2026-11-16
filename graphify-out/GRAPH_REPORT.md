# Graph Report - indoor-map  (2026-11-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8627 nodes · 27344 edges · 315 communities (232 shown, 83 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 400 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e9dd91f`
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
- Community 238
- Community 239
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
- Community 255
- Community 257
- Community 259
- Community 260
- Community 261
- Community 262
- Community 263
- Community 264
- Community 265
- Community 269

## God Nodes (most connected - your core abstractions)
1. `Button()` - 293 edges
2. `VenueId` - 192 edges
3. `cn()` - 145 edges
4. `Input()` - 125 edges
5. `test` - 111 edges
6. `toDataError()` - 100 edges
7. `createRepositories()` - 99 edges
8. `DataError` - 91 edges
9. `FormNotice()` - 90 edges
10. `Skeleton()` - 89 edges

## Surprising Connections (you probably didn't know these)
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `choose()` --indirect_call--> `locations()`  [INFERRED]
  apps/admin/src/features/import/import-dialog.tsx → tests/perf/src/large-venue.ts

## Import Cycles
- None detected.

## Communities (315 total, 83 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (45): FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, TestVenue, unitSquare(), AdminShell, EditorPage (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (102): RFC-6238, createRepositories(), DataClientConfig, CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums (+94 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (129): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), BrandGallery(), COLUMNS (+121 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (130): ContrastTable(), readToken(), submit(), BackupHistory(), Certificate(), Disks(), LastBackup(), Row() (+122 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (103): currentProfileKey, useAuthSync(), RequireAuth(), AuthLayout(), FormNotice(), ForgotPasswordPage(), ACTIVITY_EVENTS, clearActivity() (+95 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (110): Field(), others, TimezoneSelect(), VenuePicker(), ROLE_LABELS, ClosurePlaces, floorLabel(), fromVenueInput() (+102 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (98): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, createAuthRepository(), signOut() (+90 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (91): FormPlace, BUILDINGS, FLOORS, g, venueId, searchPlaces(), floors, gu (+83 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (83): move(), CategoriesRepository, CategoryRow, mapCategoryRow(), createLocationTypesRepository(), FieldRow, LocationTypesRepository, mapFieldRow() (+75 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (85): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, EndsDialog(), EndsForm(), useVenueTimezone(), ConnectorDialog() (+77 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (42): env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY (+34 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (87): COLUMNS, dateFormat, FILTERS, FloorPlanHistory(), PlanTable(), FIELDS_PREFIX, FieldsTable(), moveTo() (+79 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (51): CadConverterRepository, CadLayer, CadRender, createCadConverterRepository(), post(), STATUS_KINDS, createEditLocksRepository(), acquire() (+43 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (72): app.check_edge_same_floor(), app.check_unit_single_location(), app.on_venue_created(), app.release_units_on_permanent_close(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx (+64 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (38): VenueSelection, DataClient, AliasesRepository, ConnectorsRepository, FeaturesRepository, InstructionTemplatesRepository, NavGraphChanges, NavGraphRepository (+30 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (84): UnitLocation(), ACTION_LABELS, ImportDialog(), choose(), PLAN_COLUMNS, RESULT_FILTER, Summary(), readTable() (+76 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (70): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+62 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (77): signedLicense(), paidLicense(), canonicalize(), fromBase64(), importLicensePublicKey(), isCount(), isDate(), LicenseIssueRequest (+69 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (71): COORDINATE_DECIMALS, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR, POINT_STYLE (+63 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (63): highlightBounds(), targetOfPick(), facility, index, snapshot, graph, index, lobby (+55 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (58): CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX, moveCamera(), features (+50 more)

### Community 22 - "Community 22"
Cohesion: 0.04
Nodes (69): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react@catalog:, @types/react-dom@catalog: (+61 more)

### Community 23 - "Community 23"
Cohesion: 0.03
Nodes (44): diagnoseWriteRejection(), sql(), json(), read(), results, root, DESKTOP, repoRoot (+36 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (24): seedPublishHistory(), envFile, VENUES, CONTEXT, VENUES, airportVenue(), dailyHours(), stableUuid() (+16 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (32): createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor, FeatureEditorCallbacks, hitsGeometry() (+24 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (42): SheetSnap, closure(), RouteAction(), featureName(), featurePosition(), featureView(), OriginView, originView() (+34 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (44): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+36 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (46): PlanBackground, ValidationOverlay(), Corners, attributed, Basemap, BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID, firstLayerAfterBackground() (+38 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (37): submit(), ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary (+29 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (48): PanelMessage(), useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX (+40 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (45): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), VenueSpec, checkCustomField(), CustomField, CustomFieldProblem (+37 more)

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (23): AuthRepository, TablesUpdate, zeroRowsError(), createBuildingsRepository(), fetchOne(), MfaRepository, createProfilesRepository(), mapProfileRow() (+15 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (41): NON_RETRYABLE, queryClient, Tables, DataError, geometryFromColumn(), geometryToColumn(), nullableGeometryFromColumn(), positionFromColumn() (+33 more)

### Community 36 - "Community 36"
Cohesion: 0.07
Nodes (45): GraphLayer(), createGraphInteractions(), onMove(), onUp(), preview(), snapped(), EMPTY, ensureGraphLayers() (+37 more)

### Community 37 - "Community 37"
Cohesion: 0.09
Nodes (53): Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal(), FALLBACK_CENTER (+45 more)

### Community 38 - "Community 38"
Cohesion: 0.05
Nodes (51): PositionSchema, DisplayField, PREVIEW_READY, PREVIEW_SNAPSHOT, PreviewSnapshotMessage, INSTRUCTION_ACTIONS, BuildingSchema, FeatureSchema (+43 more)

### Community 39 - "Community 39"
Cohesion: 0.08
Nodes (48): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+40 more)

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (46): colorNotes(), BrandingPreview(), CHIPS, Mark(), RouteSketch(), BrandingForm(), BrandingPanel(), LogoDraft (+38 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (42): app.user_role(), floor_plans_one_active, public.floor_plans, public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin (+34 more)

### Community 42 - "Community 42"
Cohesion: 0.09
Nodes (41): data, initialAuthRedirectHash, useVenueSelection, venuesKey, Editor(), footprintCenter(), useActivePlan(), useFloorSelection() (+33 more)

### Community 43 - "Community 43"
Cohesion: 0.04
Nodes (53): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:*, lucide-react@catalog:, react@catalog: (+45 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (49): stringList(), toLicenseKey(), jakartaDay(), ActivationCheck, ActivationRequest, checkActivationRequest(), CROCKFORD_BASE32, isLicenseKeyStatus() (+41 more)

### Community 45 - "Community 45"
Cohesion: 0.08
Nodes (48): at(), gzipBytes(), largeVenue(), ring(), floorPlace(), floorRank(), LocationPlace, locationPlaces() (+40 more)

### Community 46 - "Community 46"
Cohesion: 0.10
Nodes (42): licenseFileName(), HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice() (+34 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (41): ColorField(), isColorValue(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FacilityIconPreview(), FacilityTypeDialog() (+33 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (45): hasOpeningHours(), hhmm(), isOpenAt(), localParts(), minutes(), OpeningHours, OpeningHoursProblem, OpeningSpan (+37 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (38): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+30 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (28): public.hosting_queue_next(), hosting.vendor_actions, vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create() (+20 more)

### Community 51 - "Community 51"
Cohesion: 0.09
Nodes (41): inVenueTime(), Closures(), FILTERS, isState(), STATES, STATUS, flushEditor(), useClosureMutations() (+33 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (42): SnapshotPolygon, AIRLINES, FOOD, RETAIL, BuildingSpec, BuiltBuilding, BuiltFloor, FloorSpec (+34 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (28): EditorState, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, SaveSource, SaveState, withPatch() (+20 more)

### Community 54 - "Community 54"
Cohesion: 0.08
Nodes (42): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+34 more)

### Community 55 - "Community 55"
Cohesion: 0.05
Nodes (46): lucide-react@catalog:, react-dom@catalog:, lucide-react, react-dom, lucide-react@catalog:, react-dom@catalog:, dependencies, class-variance-authority@catalog: (+38 more)

### Community 56 - "Community 56"
Cohesion: 0.14
Nodes (40): attachAt(), clamp01(), closestBetween(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+32 more)

### Community 57 - "Community 57"
Cohesion: 0.08
Nodes (31): EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+23 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (39): RouteGraphStatus, visitorRoute(), ExploreContext, ExploreData, ExploreProvider(), loadSearch(), routeCache(), getCachedSearchIndex() (+31 more)

### Community 59 - "Community 59"
Cohesion: 0.07
Nodes (34): createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload(), checkIconPng(), createFacilityTypesRepository(), inUseError() (+26 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (29): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+21 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (37): DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult, requestTrial(), VerifyResult, visitorUrl (+29 more)

### Community 62 - "Community 62"
Cohesion: 0.10
Nodes (34): snapshotGraphPath(), splitSnapshot(), hasBlockingFindings(), venueToday(), INACTIVE, activeSnapshot(), activeVersion(), BlockedError (+26 more)

### Community 63 - "Community 63"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 64 - "Community 64"
Cohesion: 0.07
Nodes (26): Fixtures, PublishedVenue, globalSetup(), Attempt, RoleTargets, SERVER_ATTEMPTS, SQUARE, capture() (+18 more)

### Community 65 - "Community 65"
Cohesion: 0.12
Nodes (35): newLicenseId(), onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role, ROLES, activeSuperAdmin() (+27 more)

### Community 66 - "Community 66"
Cohesion: 0.08
Nodes (35): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+27 more)

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (33): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toPatch(), validate(), submit() (+25 more)

### Community 68 - "Community 68"
Cohesion: 0.10
Nodes (31): ClosureMarkData, SnapshotPosition, ENTRANCES, BUILDING_DOOR_M, ELEVATOR_BASE_M, ELEVATOR_PER_FLOOR_M, ESCALATOR_PER_FLOOR_M, STAIRS_PER_FLOOR_M (+23 more)

### Community 69 - "Community 69"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 70 - "Community 70"
Cohesion: 0.06
Nodes (40): react-router@catalog:, @tanstack/react-query@catalog:, zustand@catalog:, react-router, @tanstack/react-query, zustand, @tanstack/react-query@catalog:, dependencies (+32 more)

### Community 71 - "Community 71"
Cohesion: 0.10
Nodes (29): Providers(), rootElement, router, App(), Gate, gateKey, readGate(), AuthShell() (+21 more)

### Community 72 - "Community 72"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 73 - "Community 73"
Cohesion: 0.10
Nodes (35): iconSpecs(), categoryIconSpecs(), facilityIconSpecs(), parseFacilityIcon(), hasLocationIcon, kind, LABEL_LAYER_ID, LABEL_SOURCE_ID (+27 more)

### Community 74 - "Community 74"
Cohesion: 0.08
Nodes (29): ClosedElements, closedElements(), ClosedElementsOptions, ClosureFeature, featureNodeIds(), polygonsOf(), ClosureImpact, closureImpact() (+21 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 76 - "Community 76"
Cohesion: 0.11
Nodes (32): useNow(), PlaceDisplay, floorText(), KIND_ORDER, placeKey(), PlaceKind, placeName(), PlaceOption (+24 more)

### Community 77 - "Community 77"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 78 - "Community 78"
Cohesion: 0.12
Nodes (30): createForUnit(), editorQueues(), graphSaveQueue(), pickFacilityTypeId(), PropertiesPatch, saveQueue(), SHAPE_OF, UNIT_CODE_MESSAGES (+22 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (29): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+21 more)

### Community 80 - "Community 80"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 83 - "Community 83"
Cohesion: 0.11
Nodes (29): BuildingType, slugFromName(), withNewIds(), newToken(), sha256Hex(), toBase64Url(), TRIAL_ENDED, activate() (+21 more)

### Community 84 - "Community 84"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/ui@workspace:*, pdfjs-dist@catalog:, react@catalog: (+27 more)

### Community 85 - "Community 85"
Cohesion: 0.12
Nodes (28): AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState, useSidebar, MODULE_NAV (+20 more)

### Community 86 - "Community 86"
Cohesion: 0.07
Nodes (22): app.trial_venue(), hosting.trials, app.venue_locked(), hosting.blocklist, hosting.capacity(), hosting.trial_requests, public.hosting_request_get(), public.hosting_request_requeue() (+14 more)

### Community 87 - "Community 87"
Cohesion: 0.09
Nodes (12): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+4 more)

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (14): appServers, args, CI, projectArgs, perfEnv, tls, Violation, median() (+6 more)

### Community 89 - "Community 89"
Cohesion: 0.11
Nodes (20): SnapshotGraph, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs, nodeDistanceM(), connectorAllows(), connectorArcs() (+12 more)

### Community 90 - "Community 90"
Cohesion: 0.15
Nodes (26): AccountMenu(), count, ISSUE_TITLES, ValidationSummary(), useExportUserData(), saveJson(), UserDataMenu(), download() (+18 more)

### Community 91 - "Community 91"
Cohesion: 0.09
Nodes (16): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+8 more)

### Community 92 - "Community 92"
Cohesion: 0.07
Nodes (32): @types/node, devDependencies, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+24 more)

### Community 93 - "Community 93"
Cohesion: 0.14
Nodes (25): drawKindLabel(), drawKindValue(), FEATURE_KIND_LABELS, OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, CommitInput(), FacilityFields(), hasHeight() (+17 more)

### Community 94 - "Community 94"
Cohesion: 0.11
Nodes (24): ACTION_ICONS, InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), INSTRUCTION_ACTION_LABELS, InstructionAction (+16 more)

### Community 95 - "Community 95"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 96 - "Community 96"
Cohesion: 0.15
Nodes (28): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+20 more)

### Community 97 - "Community 97"
Cohesion: 0.11
Nodes (26): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toFormValues(), toPatch() (+18 more)

### Community 98 - "Community 98"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 99 - "Community 99"
Cohesion: 0.11
Nodes (23): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), EntranceFeature, Geometry, LinearRingSchema, LineString (+15 more)

### Community 100 - "Community 100"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 101 - "Community 101"
Cohesion: 0.17
Nodes (26): SnapshotNavNode, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+18 more)

### Community 102 - "Community 102"
Cohesion: 0.12
Nodes (26): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), createSelectionInteractions(), onDown(), onMove(), onUp() (+18 more)

### Community 103 - "Community 103"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 104 - "Community 104"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 105 - "Community 105"
Cohesion: 0.12
Nodes (21): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), ClosureMenu, CONTROL_LABELS, FALLBACK_CENTER, count, GraphLegend() (+13 more)

### Community 106 - "Community 106"
Cohesion: 0.20
Nodes (19): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf() (+11 more)

### Community 107 - "Community 107"
Cohesion: 0.08
Nodes (13): LicenseRepository, PaidFeature, GRACE_DAYS, LicenseLimits, LicenseNotice, LIMIT_KINDS, LIMIT_LABELS, LimitKind (+5 more)

### Community 108 - "Community 108"
Cohesion: 0.13
Nodes (21): infoPointsKey(), useRemoveInfoPoint(), useSaveInfoPoint(), OriginPointDraft, originPointsKey(), SnapError, toChanges(), useOriginPoints() (+13 more)

### Community 109 - "Community 109"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 110 - "Community 110"
Cohesion: 0.10
Nodes (17): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), locations_venue_name_idx (+9 more)

### Community 111 - "Community 111"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 112 - "Community 112"
Cohesion: 0.09
Nodes (16): NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), rootElement (+8 more)

### Community 113 - "Community 113"
Cohesion: 0.09
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.has_verified_totp(), app.mfa_recovery_codes, app.mfa_required_roles(), app.user_role() (+7 more)

### Community 114 - "Community 114"
Cohesion: 0.08
Nodes (26): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name, runs-on (+18 more)

### Community 115 - "Community 115"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 116 - "Community 116"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 117 - "Community 117"
Cohesion: 0.14
Nodes (22): distanceM(), haversineM(), CONNECTOR_ACTIONS, connectorSteps(), INSTRUCTION_PLACEHOLDERS, InstructionPlaceholder, placeholderValue(), pointStep() (+14 more)

### Community 118 - "Community 118"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 119 - "Community 119"
Cohesion: 0.13
Nodes (22): GraphChangesInput, EditorPatch, applyGraphPatch(), Waypoint, edgeLengthM(), NAV_NODE_ROLES, NavEdge, NavNode (+14 more)

### Community 120 - "Community 120"
Cohesion: 0.20
Nodes (21): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+13 more)

### Community 121 - "Community 121"
Cohesion: 0.14
Nodes (16): data, closureMarks(), knownClosures(), base, snapshot, useClosureMap(), CLOSURE_REFRESH_MS, closuresQuery() (+8 more)

### Community 122 - "Community 122"
Cohesion: 0.09
Nodes (24): typescript, dependencies, zod@catalog:, devDependencies, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+16 more)

### Community 123 - "Community 123"
Cohesion: 0.14
Nodes (21): isEulaVersion(), needsEulaAcceptance(), LicenseRejection, ActivationError, createFirstAdmin(), eulaToRecord(), fromVendor(), handle() (+13 more)

### Community 124 - "Community 124"
Cohesion: 0.18
Nodes (18): submit(), aStar(), Goal, MinHeap, SearchOptions, SearchResult, Seed, directCost() (+10 more)

### Community 125 - "Community 125"
Cohesion: 0.14
Nodes (17): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+9 more)

### Community 126 - "Community 126"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 127 - "Community 127"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 128 - "Community 128"
Cohesion: 0.15
Nodes (15): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+7 more)

### Community 129 - "Community 129"
Cohesion: 0.15
Nodes (20): BrandingFormErrors, BrandingFormValues, ColorNote, livePreview(), MESSAGES, ratio, empty, toBrandingFormValues() (+12 more)

### Community 130 - "Community 130"
Cohesion: 0.19
Nodes (12): page, authorOf(), ExtraNotice, licenseOf(), Notice, NOTICES_FILE, NoticesOptions, readNotice() (+4 more)

### Community 131 - "Community 131"
Cohesion: 0.16
Nodes (16): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), Prefetch, PrefetchHolder, take() (+8 more)

### Community 132 - "Community 132"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 133 - "Community 133"
Cohesion: 0.14
Nodes (19): appliedColors, feature(), FLOW_DASHES, flows, is(), Role, ROUTE_FLOW_STEPS, ROUTE_LAYER_IDS (+11 more)

### Community 134 - "Community 134"
Cohesion: 0.15
Nodes (19): changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formFloorIds(), initialForm(), levelOf(), commit() (+11 more)

### Community 135 - "Community 135"
Cohesion: 0.16
Nodes (7): Entry, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges()

### Community 136 - "Community 136"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 137 - "Community 137"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 138 - "Community 138"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 139 - "Community 139"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 140 - "Community 140"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 141 - "Community 141"
Cohesion: 0.15
Nodes (15): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+7 more)

### Community 142 - "Community 142"
Cohesion: 0.16
Nodes (17): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+9 more)

### Community 143 - "Community 143"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 144 - "Community 144"
Cohesion: 0.24
Nodes (15): home(), LanguageSwitch(), MobileMenu(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES (+7 more)

### Community 145 - "Community 145"
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 146 - "Community 146"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 147 - "Community 147"
Cohesion: 0.14
Nodes (13): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+5 more)

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (14): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+6 more)

### Community 149 - "Community 149"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 150 - "Community 150"
Cohesion: 0.25
Nodes (15): useConnectors(), useCurrentClosures(), useVenueGraph(), NONE, NOTHING_CLOSED, otherFloors(), useGraphStatus(), instructionTemplatesKey() (+7 more)

### Community 151 - "Community 151"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 152 - "Community 152"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 153 - "Community 153"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 154 - "Community 154"
Cohesion: 0.12
Nodes (18): @biomejs/biome, @biomejs/biome@catalog:, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+10 more)

### Community 155 - "Community 155"
Cohesion: 0.19
Nodes (12): ConnectorDialogState, useConnectorDialog, ConnectorDetails(), ConnectorPanel(), DIRECTION_LABELS, stopNames(), ANCHOR_OWNERS, Facts() (+4 more)

### Community 156 - "Community 156"
Cohesion: 0.13
Nodes (16): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.15
Nodes (12): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+4 more)

### Community 158 - "Community 158"
Cohesion: 0.12
Nodes (17): bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest (+9 more)

### Community 159 - "Community 159"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 160 - "Community 160"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 161 - "Community 161"
Cohesion: 0.17
Nodes (13): TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point(), VENUE_ROW_TABLES, VenueRow (+5 more)

### Community 162 - "Community 162"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 163 - "Community 163"
Cohesion: 0.15
Nodes (9): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.take_over_edit_lock() (+1 more)

### Community 164 - "Community 164"
Cohesion: 0.29
Nodes (13): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+5 more)

### Community 165 - "Community 165"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 166 - "Community 166"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 168 - "Community 168"
Cohesion: 0.14
Nodes (10): PolygonSchema, dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, EDIT_COLORS, PolygonDrawer (+2 more)

### Community 169 - "Community 169"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), mixdown() (+6 more)

### Community 170 - "Community 170"
Cohesion: 0.14
Nodes (4): app.enforce_quota(), app.quota_limit(), app.quota_venue(), venue_members_quota

### Community 171 - "Community 171"
Cohesion: 0.26
Nodes (12): WithTooltip(), EditorToolbar(), HistoryButton(), TOOLS, isTyping(), TOOL_BY_KEY, TOOL_SHORTCUTS, UNDO_SHORTCUT (+4 more)

### Community 172 - "Community 172"
Cohesion: 0.15
Nodes (3): TestRouteState, SnapshotLanguage, InstructionContext

### Community 173 - "Community 173"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 174 - "Community 174"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 175 - "Community 175"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 176 - "Community 176"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 177 - "Community 177"
Cohesion: 0.28
Nodes (11): ResolvedEnd, resolveEnd(), Snap, snapToEdge(), connectorsBetween(), floorNeighbours(), floorsOf(), frontier() (+3 more)

### Community 178 - "Community 178"
Cohesion: 0.26
Nodes (9): SearchField(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard() (+1 more)

### Community 179 - "Community 179"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 180 - "Community 180"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 181 - "Community 181"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 182 - "Community 182"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 183 - "Community 183"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 184 - "Community 184"
Cohesion: 0.30
Nodes (8): gridGraph(), { performance }, distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 185 - "Community 185"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 186 - "Community 186"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 187 - "Community 187"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 188 - "Community 188"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 189 - "Community 189"
Cohesion: 0.24
Nodes (9): BASE, corridor, EMPTY, FEATURES, m(), near(), point(), unit() (+1 more)

### Community 190 - "Community 190"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 191 - "Community 191"
Cohesion: 0.22
Nodes (8): app.can_write_floor(), app.can_write_location(), app.can_write_location_type(), app.reject_locked_venue(), app.writable_venue_ids(), edit_locks_trial_lock, public.trial_status(), publications_trial_lock

### Community 192 - "Community 192"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 193 - "Community 193"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 194 - "Community 194"
Cohesion: 0.20
Nodes (7): { chromium }, EMBLEMS, font, LOGOS, out, require, root

### Community 195 - "Community 195"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 197 - "Community 197"
Cohesion: 0.33
Nodes (7): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 198 - "Community 198"
Cohesion: 0.29
Nodes (7): [product, nodeModules], collectNotices(), label(), noticesOf(), packageRoot(), packageRootsIn(), renderNotices()

### Community 199 - "Community 199"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 200 - "Community 200"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 201 - "Community 201"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 202 - "Community 202"
Cohesion: 0.33
Nodes (7): ConnectorInput, ConnectorRow, isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft

### Community 203 - "Community 203"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 204 - "Community 204"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 205 - "Community 205"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 206 - "Community 206"
Cohesion: 0.39
Nodes (6): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 208 - "Community 208"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 209 - "Community 209"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 210 - "Community 210"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 212 - "Community 212"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 213 - "Community 213"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 214 - "Community 214"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 215 - "Community 215"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 216 - "Community 216"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 218 - "Community 218"
Cohesion: 0.47
Nodes (3): Demo(), DemoBoundary, DemoMap

### Community 219 - "Community 219"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 220 - "Community 220"
Cohesion: 0.47
Nodes (5): domainGraph(), filesIn(), functionsDir, root, specifiers()

### Community 221 - "Community 221"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 224 - "Community 224"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.33
Nodes (5): [command, ...args], env, result, root, supabase

### Community 226 - "Community 226"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 227 - "Community 227"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 228 - "Community 228"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 229 - "Community 229"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 230 - "Community 230"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 231 - "Community 231"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 232 - "Community 232"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 233 - "Community 233"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 234 - "Community 234"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `TARGETS`, `RFC-2045`, `RFC-2387`, `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2539 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 17` to `Community 164`, `Community 4`, `Community 70`, `Community 39`, `Community 5`, `Community 9`, `Community 112`, `Community 81`, `Community 178`, `Community 21`, `Community 26`, `Community 30`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `TARGETS`, `RFC-2045` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.027114427860696518 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 9` to `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 137`, `Community 11`, `Community 142`, `Community 15`, `Community 144`, `Community 17`, `Community 26`, `Community 155`, `Community 30`, `Community 37`, `Community 39`, `Community 40`, `Community 42`, `Community 47`, `Community 51`, `Community 54`, `Community 57`, `Community 61`, `Community 71`, `Community 76`, `Community 90`, `Community 218`, `Community 93`, `Community 94`, `Community 97`, `Community 120`, `Community 125`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02733578131374949 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 14` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 131`, `Community 5`, `Community 6`, `Community 7`, `Community 135`, `Community 9`, `Community 8`, `Community 11`, `Community 12`, `Community 15`, `Community 150`, `Community 24`, `Community 26`, `Community 155`, `Community 27`, `Community 30`, `Community 35`, `Community 40`, `Community 42`, `Community 47`, `Community 51`, `Community 59`, `Community 66`, `Community 67`, `Community 202`, `Community 76`, `Community 78`, `Community 91`, `Community 105`, `Community 108`, `Community 121`, `Community 126`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0390096329910039 - nodes in this community are weakly interconnected._