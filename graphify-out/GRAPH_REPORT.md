# Graph Report - indoor-map  (2026-11-23)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 10022 nodes · 32167 edges · 350 communities (262 shown, 88 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 527 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebf6dbcf`
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
- Community 253
- Community 254
- Community 255
- Community 256
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
- Community 268
- Community 269
- Community 271
- Community 272
- Community 273
- Community 274
- Community 275
- Community 276
- Community 277
- Community 278
- Community 279
- Community 280
- Community 281
- Community 285
- Community 288
- Community 289
- Community 290
- Community 291
- Community 292
- Community 293
- Community 294
- Community 298

## God Nodes (most connected - your core abstractions)
1. `Button()` - 350 edges
2. `VenueId` - 250 edges
3. `cn()` - 148 edges
4. `Input()` - 144 edges
5. `test` - 128 edges
6. `toDataError()` - 119 edges
7. `createRepositories()` - 115 edges
8. `FormNotice()` - 109 edges
9. `DialogHeader()` - 104 edges
10. `DialogTitle()` - 104 edges

## Surprising Connections (you probably didn't know these)
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `submit()` --indirect_call--> `floorName()`  [INFERRED]
  apps/admin/src/features/origin-points/board-dialogs.tsx → tests/perf/src/large-venue.ts

## Import Cycles
- None detected.

## Communities (350 total, 88 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (159): FormState, submit(), createAuthRepository(), signOut(), Tables, CODE_RULES, CodeRule, DataError (+151 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (159): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), inVenueTime(), HomeRedirect() (+151 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (148): Choice(), fileSlug(), saveBlob(), FormNotice(), ConnectorDialog(), ConnectorFormBody(), submit(), changeKind() (+140 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (112): createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, TablesInsert (+104 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (137): PlanBackground, MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, EDIT_COLORS, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL (+129 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (141): ColorField(), isColorValue(), Field(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), chooseImage() (+133 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (39): FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, unitSquare(), AdminShell, EditorPage, EditorTool (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (113): submit(), SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs, nodeDistanceM() (+105 more)

### Community 8 - "Community 8"
Cohesion: 0.02
Nodes (105): floors, gu, options, radiology, square, toilet, venueId, Draft (+97 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (92): BrandGallery(), Section(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage(), AccountMenu(), AppLayout() (+84 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (112): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+104 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (115): InsertedVenue, english(), locationDescription(), LocationPlace, Place, SnapshotIndex, PositionSchema, hasOpeningHours() (+107 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (50): RFC-6238, ACCOUNTS, env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial() (+42 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (72): seedPublishHistory(), envFile, VENUES, SnapshotPolygon, CONTEXT, VENUES, ADDRESS, Collection (+64 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (108): COLUMNS, DataTableGallery(), date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES (+100 more)

### Community 15 - "Community 15"
Cohesion: 0.02
Nodes (46): VenueSelection, EventSave, AnalyticsQueue, DataClient, DataClientConfig, AliasesRepository, AnalyticsConfig, AnalyticsRepository (+38 more)

### Community 16 - "Community 16"
Cohesion: 0.04
Nodes (85): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, AuthLayout() (+77 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (87): floorCollection(), shownFloorOf(), BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp() (+79 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (86): loadCrowd(), crowdAreas(), useCrowdMap(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson() (+78 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (73): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+65 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (17): VisitorPage, createVariedVenues(), specs(), shot(), visitorSearch(), TILE_PNG, DESKTOP, repoRoot (+9 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (64): instructionTemplatesKey(), useInstructionTemplates(), InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), FILTERS (+56 more)

### Community 22 - "Community 22"
Cohesion: 0.06
Nodes (72): COLUMNS, dateFormat, FILTERS, FloorPlanHistory(), PlanTable(), FIELDS_PREFIX, FieldsTable(), FILTERS (+64 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (61): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+53 more)

### Community 24 - "Community 24"
Cohesion: 0.05
Nodes (69): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+61 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (64): EntityIcon(), ListRow(), EventList(), useEventListings(), useLiveEvents(), FacilityDetail(), Missing(), UnitDetail() (+56 more)

### Community 26 - "Community 26"
Cohesion: 0.04
Nodes (49): COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor, FeatureEditorCallbacks (+41 more)

### Community 27 - "Community 27"
Cohesion: 0.04
Nodes (49): app.user_role(), audit_events_occurred_idx, public.audit_events, public.edit_locks, public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes() (+41 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (57): GraphLayer(), count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle(), GraphStatus (+49 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (57): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+49 more)

### Community 30 - "Community 30"
Cohesion: 0.06
Nodes (65): signedLicense(), paidLicense(), canonicalize(), fromBase64(), isCount(), isDate(), isText(), Json (+57 more)

### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (71): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react-dom@catalog:, typescript@catalog: (+63 more)

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (39): unit(), SheetSnap, closure(), failure, createExploreStore(), ExploreList, ExploreState, FocusMode (+31 more)

### Community 33 - "Community 33"
Cohesion: 0.04
Nodes (34): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+26 more)

### Community 34 - "Community 34"
Cohesion: 0.06
Nodes (56): BasemapUrlProblem, escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES (+48 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (59): floorLabel(), useConnectorDialog, CONNECTOR_KIND_LABELS, ConnectorDetails(), DIRECTION_LABELS, stopNames(), connectorsKey(), syncStop() (+51 more)

### Community 36 - "Community 36"
Cohesion: 0.04
Nodes (50): DEFAULT_INSTRUCTION_TEMPLATES, connector(), connectors, edge(), edges, ENTRANCES, escalatorDown, escalatorUp (+42 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (54): Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal(), FALLBACK_CENTER (+46 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (40): PlaceOption, TestRouteState, RouteGraphStatus, placeOfTarget(), AddStop(), targetOfHit(), nearestTarget(), RouteFailure (+32 more)

### Community 40 - "Community 40"
Cohesion: 0.05
Nodes (39): Page, PageQuery, ActorRow, asRecord(), AuditFilters, AuditRepository, AuditRow, createAuditRepository() (+31 more)

### Community 41 - "Community 41"
Cohesion: 0.04
Nodes (45): FloorFeatures, createFloorsRepository(), fetchOne(), FloorRow, FloorsRepository, mapFloorRow(), createLocationTypesRepository(), FieldRow (+37 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (55): checkGlb(), checkModelPlacement(), GLB_MIME, GLB_PROBLEM_MESSAGES, GlbProblem, inRange(), latin1(), LibraryModel (+47 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (53): BUILDING_SIZES, BUILDING_TYPES, CSV_LABELS, date, dateTime, formatDate(), REJECT_REASONS, STAGES (+45 more)

### Community 44 - "Community 44"
Cohesion: 0.05
Nodes (43): facility, index, snapshot, at(), gzipBytes(), largeVenue(), ring(), PREVIEW_READY (+35 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 46 - "Community 46"
Cohesion: 0.07
Nodes (34): Fixtures, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+26 more)

### Community 47 - "Community 47"
Cohesion: 0.07
Nodes (38): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.features, public.field_definitions, public.location_categories (+30 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (43): useNow(), capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText() (+35 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (26): appServers, args, CI, projectArgs, capture(), shot(), createFullVenue(), Db (+18 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (38): PanelMessage(), NON_RETRYABLE, queryClient, useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo() (+30 more)

### Community 51 - "Community 51"
Cohesion: 0.05
Nodes (51): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, react@catalog:, react-dom@catalog:, react-router@catalog:, zustand@catalog: (+43 more)

### Community 52 - "Community 52"
Cohesion: 0.06
Nodes (47): API_SCOPE_LABELS, API_SCOPES, API_UPSERT_MAX, ApiClosureInput, ApiHoursRow, ApiLocationUpsert, ApiParse, ApiScope (+39 more)

### Community 53 - "Community 53"
Cohesion: 0.10
Nodes (44): newLicenseId(), LicenseRejection, onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role, ROLES (+36 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (38): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+30 more)

### Community 55 - "Community 55"
Cohesion: 0.06
Nodes (26): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+18 more)

### Community 56 - "Community 56"
Cohesion: 0.09
Nodes (48): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+40 more)

### Community 57 - "Community 57"
Cohesion: 0.07
Nodes (38): opening_hours_location_idx, public.opening_hours, app.api_key_check(), app.api_spans(), app.check_venue_list(), app.check_webhook_input(), app.webhook_flush(), app.webhook_on_location() (+30 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (41): EntranceState, EntrancesPanel(), suggest(), FeatureButton(), meters, REASON_LABELS, SOURCE_LABELS, SuggestionList() (+33 more)

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (45): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+37 more)

### Community 60 - "Community 60"
Cohesion: 0.05
Nodes (49): lucide-react@catalog:, @types/react@catalog:, lucide-react, @types/react, @types/react@catalog:, @types/react@catalog:, lucide-react@catalog:, @types/react@catalog: (+41 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (35): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf() (+27 more)

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (36): candidateLabels(), CandidateList(), KIND_LABELS, Results(), ScanPanel(), useActivePlan(), useScan(), EMPTY (+28 more)

### Community 63 - "Community 63"
Cohesion: 0.07
Nodes (38): createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload(), checkIconPng(), createFacilityTypesRepository(), inUseError() (+30 more)

### Community 64 - "Community 64"
Cohesion: 0.07
Nodes (27): hosting.vendor_actions, vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create(), public.vendor_license_record() (+19 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (38): createMediaRepository(), list(), IMAGE_EXTENSIONS, isBucket(), mapMediaRow(), MediaRepository, MediaRow, usagesOf() (+30 more)

### Community 66 - "Community 66"
Cohesion: 0.07
Nodes (38): geometryOf(), RouteLayer(), floorGraph(), OriginMap(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds() (+30 more)

### Community 67 - "Community 67"
Cohesion: 0.05
Nodes (28): createAnalyticsRepository(), CadConverterRepository, CadLayer, CadRender, createCadConverterRepository(), post(), DXF, Messages (+20 more)

### Community 68 - "Community 68"
Cohesion: 0.07
Nodes (28): choose(), EditorState, EMPTY_GRAPH, FeaturePatch, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, isEmpty() (+20 more)

### Community 69 - "Community 69"
Cohesion: 0.07
Nodes (38): featurePosition(), endPlace(), endTarget(), featureAt(), placeEnd(), SharedState, sharedState(), facility (+30 more)

### Community 70 - "Community 70"
Cohesion: 0.06
Nodes (29): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+21 more)

### Community 71 - "Community 71"
Cohesion: 0.06
Nodes (41): IMDF_ACCESS_CONTROL, IMDF_ACCESSIBILITY, IMDF_AMENITY_CATEGORIES, IMDF_BUILDING_CATEGORIES, IMDF_FOOTPRINT_CATEGORIES, IMDF_LEVEL_CATEGORIES, IMDF_OCCUPANT_CATEGORIES, IMDF_OPENING_CATEGORIES (+33 more)

### Community 72 - "Community 72"
Cohesion: 0.09
Nodes (34): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), useSnapshot(), Prefetch, PrefetchHolder (+26 more)

### Community 73 - "Community 73"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 74 - "Community 74"
Cohesion: 0.10
Nodes (35): copy(), Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date (+27 more)

### Community 75 - "Community 75"
Cohesion: 0.05
Nodes (42): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+34 more)

### Community 76 - "Community 76"
Cohesion: 0.12
Nodes (37): SnapshotNavNode, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+29 more)

### Community 77 - "Community 77"
Cohesion: 0.10
Nodes (33): passwordKey, settingsKey, useSaveSystemSettings(), useSendTestEmail(), useSmtpPasswordIsSet(), useSystemSettings(), BASEMAP_MESSAGES, orNull() (+25 more)

### Community 78 - "Community 78"
Cohesion: 0.13
Nodes (32): ImdfAmenityCategory, ImdfOccupantCategory, ImdfUnitCategory, ImdfVenueCategory, isPolygonal(), AMENITY_CATEGORY_BY_ICON, OUTDOOR_UNIT_CATEGORY, UNIT_CATEGORY_BY_KIND (+24 more)

### Community 79 - "Community 79"
Cohesion: 0.06
Nodes (23): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+15 more)

### Community 80 - "Community 80"
Cohesion: 0.10
Nodes (29): ClosurePlaces, useConnectors(), CLOSURE_REFRESH_MS, useCurrentClosures(), useVenueGraph(), venueGraphKey(), NONE, NOTHING_CLOSED (+21 more)

### Community 81 - "Community 81"
Cohesion: 0.07
Nodes (26): FALLBACK_CENTER, PublishedVenue, TestVenue, globalSetup(), Attempt, RoleTargets, SERVER_ATTEMPTS, SQUARE (+18 more)

### Community 82 - "Community 82"
Cohesion: 0.12
Nodes (31): createForUnit(), editorQueues(), graphSaveQueue(), pickFacilityTypeId(), PropertiesPatch, saveQueue(), SHAPE_OF, UNIT_CODE_MESSAGES (+23 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (34): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+26 more)

### Community 85 - "Community 85"
Cohesion: 0.10
Nodes (25): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+17 more)

### Community 86 - "Community 86"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 87 - "Community 87"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 88 - "Community 88"
Cohesion: 0.07
Nodes (22): app.trial_venue(), hosting.trials, app.venue_locked(), hosting.blocklist, hosting.trial_requests, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+14 more)

### Community 89 - "Community 89"
Cohesion: 0.22
Nodes (30): ContrastTable(), readToken(), PreviewTable(), BackupHistory(), formatDateTime(), History(), ClientsTable(), InstallationsTable() (+22 more)

### Community 90 - "Community 90"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 91 - "Community 91"
Cohesion: 0.14
Nodes (27): data, EventDetail(), EventRow(), KindBadge(), LiveBadge(), LocationEvents(), Section(), ShowOnMap() (+19 more)

### Community 92 - "Community 92"
Cohesion: 0.09
Nodes (30): expected(), LocationPageFilters, createVenueDashboardRepository(), VenueDashboardRepository, expected(), newDb(), NO_FILTERS, signIn() (+22 more)

### Community 93 - "Community 93"
Cohesion: 0.09
Nodes (19): ConnectorDialogState, OriginPointDraft, areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), Connector, LinearRingSchema (+11 more)

### Community 94 - "Community 94"
Cohesion: 0.12
Nodes (30): ExploreContext, ExploreProvider(), loadSearch(), getCachedSearchIndex(), openDB(), setCachedSearchIndex(), exploreChips(), matchToken() (+22 more)

### Community 95 - "Community 95"
Cohesion: 0.16
Nodes (25): VenueSpec, CustomField, PictogramKey, airportStation, campus, custom, factoryWarehouse, hospital (+17 more)

### Community 96 - "Community 96"
Cohesion: 0.09
Nodes (28): AREA_ORDER, areaFill(), areaStroke(), buildPrintLayout(), drawFloor(), escapeXml(), FloorDrawing, layoutsToPdf() (+20 more)

### Community 97 - "Community 97"
Cohesion: 0.10
Nodes (27): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+19 more)

### Community 98 - "Community 98"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 99 - "Community 99"
Cohesion: 0.07
Nodes (32): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+24 more)

### Community 100 - "Community 100"
Cohesion: 0.18
Nodes (25): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, fromVenueInput(), impactText(), offsetMs(), targetLabel() (+17 more)

### Community 101 - "Community 101"
Cohesion: 0.15
Nodes (28): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+20 more)

### Community 102 - "Community 102"
Cohesion: 0.15
Nodes (30): canvasArea(), connectorColor(), drawPlan(), strokeRoute(), deskAndMonitor(), LOBBY, lobby(), screenQuad() (+22 more)

### Community 103 - "Community 103"
Cohesion: 0.12
Nodes (29): TRIAL_FEATURES, TRIAL_MIN_DAYS, TRIAL_PLAN, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal() (+21 more)

### Community 104 - "Community 104"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 105 - "Community 105"
Cohesion: 0.12
Nodes (14): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+6 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (26): ExportResult, collection(), ExportFeature, ExportFeatureCollection, ExportGeometry, GEOJSON_EXPORT_FORMAT, GEOJSON_EXPORT_VERSION, graphFeatures() (+18 more)

### Community 107 - "Community 107"
Cohesion: 0.09
Nodes (15): LicenseRepository, GRACE_DAYS, importTooLarge(), LicenseLimits, LicenseNotice, LIMIT_KINDS, LIMIT_LABELS, LimitKind (+7 more)

### Community 108 - "Community 108"
Cohesion: 0.13
Nodes (25): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+17 more)

### Community 109 - "Community 109"
Cohesion: 0.13
Nodes (25): PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, choice, choosePrivacy(), listeners, PrivacyChoice (+17 more)

### Community 110 - "Community 110"
Cohesion: 0.08
Nodes (27): @indoor/data@workspace:*, pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:* (+19 more)

### Community 111 - "Community 111"
Cohesion: 0.08
Nodes (27): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, @indoor/routing@workspace:*, @axe-core/playwright, devDependencies, @axe-core/playwright@catalog:, @biomejs/biome@catalog: (+19 more)

### Community 112 - "Community 112"
Cohesion: 0.08
Nodes (27): @indoor/ui@workspace:*, @tanstack/react-query@catalog:, @indoor/ui, @tanstack/react-query, dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:*, @indoor/ui@workspace:* (+19 more)

### Community 113 - "Community 113"
Cohesion: 0.14
Nodes (20): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+12 more)

### Community 114 - "Community 114"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 115 - "Community 115"
Cohesion: 0.08
Nodes (27): @indoor/domain, dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog: (+19 more)

### Community 116 - "Community 116"
Cohesion: 0.08
Nodes (27): dependencies, zod@catalog:, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./export (+19 more)

### Community 117 - "Community 117"
Cohesion: 0.14
Nodes (25): addYear(), EVENT_LIMITS, EVENT_PHASE_LABELS, EVENT_REPEATS, EVENT_SOON_DAYS, EVENT_STATUS_LABELS, EVENT_STATUSES, EventInputErrors (+17 more)

### Community 118 - "Community 118"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 119 - "Community 119"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 120 - "Community 120"
Cohesion: 0.16
Nodes (23): SnapshotNavEdge, at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph() (+15 more)

### Community 121 - "Community 121"
Cohesion: 0.08
Nodes (19): eastGf, facilities, index, [main, east], mainGf, mainL1, mainL2, outdoor (+11 more)

### Community 122 - "Community 122"
Cohesion: 0.16
Nodes (23): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toFormValues(), toPatch(), validate() (+15 more)

### Community 123 - "Community 123"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 124 - "Community 124"
Cohesion: 0.11
Nodes (24): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, AnalyticsContext, analyticsCsv() (+16 more)

### Community 125 - "Community 125"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 126 - "Community 126"
Cohesion: 0.11
Nodes (16): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+8 more)

### Community 127 - "Community 127"
Cohesion: 0.11
Nodes (19): CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, formDraft(), formFloorIds(), FormPlace, levelOf(), BUILDINGS, FLOORS (+11 more)

### Community 128 - "Community 128"
Cohesion: 0.15
Nodes (19): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+11 more)

### Community 129 - "Community 129"
Cohesion: 0.20
Nodes (17): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+9 more)

### Community 130 - "Community 130"
Cohesion: 0.15
Nodes (21): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+13 more)

### Community 131 - "Community 131"
Cohesion: 0.13
Nodes (16): RFC-9562, createImdfWriter(), IMDF_FEATURE_TYPES, ImdfFeature, ImdfFeatureType, ImdfGeometry, hex(), isUuid() (+8 more)

### Community 132 - "Community 132"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 133 - "Community 133"
Cohesion: 0.10
Nodes (23): @biomejs/biome, @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog: (+15 more)

### Community 134 - "Community 134"
Cohesion: 0.14
Nodes (19): moveTo(), FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), checkCustomField(), customFieldInput(), CustomFieldProblem (+11 more)

### Community 135 - "Community 135"
Cohesion: 0.11
Nodes (14): LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), DYNAMIC_PREFIXES, flatten(), languages (+6 more)

### Community 136 - "Community 136"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 137 - "Community 137"
Cohesion: 0.15
Nodes (20): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+12 more)

### Community 138 - "Community 138"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 139 - "Community 139"
Cohesion: 0.23
Nodes (18): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), stepTexts(), targetName() (+10 more)

### Community 140 - "Community 140"
Cohesion: 0.16
Nodes (18): QrMatrix, BOARD_TEXTS, BoardLanguage, BoardOptions, BoardTexts, buildBoardLayout(), buildStickerSheets(), fitText() (+10 more)

### Community 141 - "Community 141"
Cohesion: 0.19
Nodes (16): channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI, BrandColors (+8 more)

### Community 142 - "Community 142"
Cohesion: 0.13
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.mfa_required_roles(), system_settings_guard_mfa, analytics_events_time, analytics_events_venue_time (+7 more)

### Community 143 - "Community 143"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 144 - "Community 144"
Cohesion: 0.17
Nodes (19): DeliveriesPanel(), isStatus(), TONES, deliveriesKey, keysKey, root, useCreateApiKey(), useCreateWebhook() (+11 more)

### Community 145 - "Community 145"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 146 - "Community 146"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 147 - "Community 147"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (15): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+7 more)

### Community 149 - "Community 149"
Cohesion: 0.11
Nodes (14): repoRoot, settled(), sheet(), build, built, { chromium }, encoded, frameFile (+6 more)

### Community 150 - "Community 150"
Cohesion: 0.16
Nodes (17): applyGraphPatch(), edgeLengthM(), NAV_NODE_ROLES, NavNodeRole, apply(), BASE, degree(), draw() (+9 more)

### Community 151 - "Community 151"
Cohesion: 0.13
Nodes (16): ENTRIES, Entry, HAYSTACKS, info(), isPictogramKey(), KEY_SET, PICTOGRAM_CATEGORIES, PICTOGRAM_CATEGORY_LABELS (+8 more)

### Community 152 - "Community 152"
Cohesion: 0.17
Nodes (16): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, newToken(), sha256Hex() (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 154 - "Community 154"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 155 - "Community 155"
Cohesion: 0.21
Nodes (16): submit(), download(), boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf(), locationStickerUrl(), mainLocations() (+8 more)

### Community 156 - "Community 156"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 157 - "Community 157"
Cohesion: 0.16
Nodes (14): ClosureMarkData, closureMarks(), knownClosures(), base, snapshot, useClosureMap(), areaFilter(), CLOSURE_COLOR (+6 more)

### Community 158 - "Community 158"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 159 - "Community 159"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 160 - "Community 160"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 161 - "Community 161"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 162 - "Community 162"
Cohesion: 0.11
Nodes (18): bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest (+10 more)

### Community 163 - "Community 163"
Cohesion: 0.12
Nodes (18): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+10 more)

### Community 164 - "Community 164"
Cohesion: 0.17
Nodes (16): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+8 more)

### Community 165 - "Community 165"
Cohesion: 0.22
Nodes (14): home(), LanguageSwitch(), MobileMenu(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PrivacyPage() (+6 more)

### Community 166 - "Community 166"
Cohesion: 0.17
Nodes (15): PAGES, root, OUTCOMES, pending, postVerify(), RequestResult, retryVerify(), VerifyResult (+7 more)

### Community 167 - "Community 167"
Cohesion: 0.12
Nodes (17): @types/node, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest, license (+9 more)

### Community 168 - "Community 168"
Cohesion: 0.12
Nodes (17): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, vitest (+9 more)

### Community 169 - "Community 169"
Cohesion: 0.14
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 170 - "Community 170"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 171 - "Community 171"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 172 - "Community 172"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 173 - "Community 173"
Cohesion: 0.19
Nodes (15): mapDisplaySettingsRow(), CameraView, CameraViewSchema, COLOR_KINDS, DISPLAY_MODES, HEIGHT_KINDS, HeightInputProblem, HeightSchema (+7 more)

### Community 174 - "Community 174"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 175 - "Community 175"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 176 - "Community 176"
Cohesion: 0.28
Nodes (13): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+5 more)

### Community 177 - "Community 177"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 178 - "Community 178"
Cohesion: 0.30
Nodes (15): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), mixdown() (+7 more)

### Community 179 - "Community 179"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 180 - "Community 180"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 181 - "Community 181"
Cohesion: 0.15
Nodes (10): FloorValidation, useFloorValidation(), MultiPolygon, issuesByFeature(), ValidatedFeature, ValidationIssue, boundary, features (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.19
Nodes (13): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+5 more)

### Community 183 - "Community 183"
Cohesion: 0.28
Nodes (5): page, vite-plugin-pwa@catalog:, vite-plugin-pwa, thirdPartyNotices(), UI_FONT_NOTICES

### Community 184 - "Community 184"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 185 - "Community 185"
Cohesion: 0.18
Nodes (11): ROLE_LABELS, API_COUNT_LABELS, AUDIT_LABELS, BULK_KINDS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES (+3 more)

### Community 186 - "Community 186"
Cohesion: 0.23
Nodes (11): checkCheckinRequest(), CheckinCheck, CheckinRequest, checkNewRelease(), InstallationReleaseState, installationReleaseState(), readSha256(), ReleaseCheck (+3 more)

### Community 187 - "Community 187"
Cohesion: 0.24
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 188 - "Community 188"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 189 - "Community 189"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 190 - "Community 190"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 191 - "Community 191"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 192 - "Community 192"
Cohesion: 0.27
Nodes (11): BRANDING_KEYS, BrandingInput, brandingJson(), BrandingProblem, checkBranding(), isRecord(), MAX_DISPLAY_NAME_LENGTH, nameLength() (+3 more)

### Community 193 - "Community 193"
Cohesion: 0.15
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 194 - "Community 194"
Cohesion: 0.22
Nodes (11): ellipse(), here, lines, lucideRoot, num(), points(), rect(), require (+3 more)

### Community 195 - "Community 195"
Cohesion: 0.23
Nodes (10): A4, analyticsPdf(), fixed(), Line, lines(), pages(), ANALYTICS_KIND_LABELS, ANALYTICS_KINDS (+2 more)

### Community 196 - "Community 196"
Cohesion: 0.24
Nodes (9): ACTIVITY_EVENTS, markActivity(), readLastActivity(), useIdleSignOut(), VENDOR_IDLE_TIMEOUT_MS, isSessionIdle(), NewPasswordProblem, PASSWORD_MIN_LENGTH (+1 more)

### Community 197 - "Community 197"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 198 - "Community 198"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 199 - "Community 199"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 200 - "Community 200"
Cohesion: 0.17
Nodes (3): VendorClientsRepository, VendorLicense, VendorTrialRequest

### Community 201 - "Community 201"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 202 - "Community 202"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 203 - "Community 203"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 204 - "Community 204"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 205 - "Community 205"
Cohesion: 0.29
Nodes (6): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NotificationKind, NotificationPreferences, withDefaultPreferences()

### Community 206 - "Community 206"
Cohesion: 0.25
Nodes (8): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHoursProblem, shiftDate(), spansOn(), office

### Community 207 - "Community 207"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 208 - "Community 208"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 209 - "Community 209"
Cohesion: 0.31
Nodes (8): submit(), isValidTimezone(), checkVenueInput(), confirmsVenueDeletion(), formatLatLng(), parseLatLng(), VENUE_TYPES, VenueInputProblem

### Community 210 - "Community 210"
Cohesion: 0.29
Nodes (9): LicensePanel(), RevokeConfirm(), todayInJakarta(), downloadLicense(), failed(), keys, useLicenseActions(), useLicenses() (+1 more)

### Community 211 - "Community 211"
Cohesion: 0.38
Nodes (6): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName(), applyBranding()

### Community 212 - "Community 212"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 213 - "Community 213"
Cohesion: 0.29
Nodes (8): ConnectorInput, ConnectorRow, createConnectorsRepository(), isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft

### Community 214 - "Community 214"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 215 - "Community 215"
Cohesion: 0.20
Nodes (7): { chromium }, EMBLEMS, font, LOGOS, out, require, root

### Community 216 - "Community 216"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 217 - "Community 217"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 218 - "Community 218"
Cohesion: 0.33
Nodes (5): ReceivedWebhook, signatureValid(), startWebhookReceiver(), shot(), visitorLabel()

### Community 220 - "Community 220"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 221 - "Community 221"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 222 - "Community 222"
Cohesion: 0.33
Nodes (6): attributed, Basemap, BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID, firstLayerAfterBackground(), setBasemap()

### Community 223 - "Community 223"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 224 - "Community 224"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 225 - "Community 225"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 226 - "Community 226"
Cohesion: 0.32
Nodes (5): base(), playlist(), PNG, setUp(), slide()

### Community 227 - "Community 227"
Cohesion: 0.39
Nodes (7): base64(), Claimed, deliver(), dispatch(), encoder, rpc(), sign()

### Community 228 - "Community 228"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 229 - "Community 229"
Cohesion: 0.29
Nodes (7): dependencies, @indoor/domain@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, react@catalog:, react-dom@catalog:, react

### Community 230 - "Community 230"
Cohesion: 0.38
Nodes (4): Demo(), DemoBoundary, DemoMap, DEMO_URL

### Community 231 - "Community 231"
Cohesion: 0.38
Nodes (6): LicenseKeysPanel(), NewKey(), failed(), keys, useLicenseKeyActions(), useLicenseKeys()

### Community 232 - "Community 232"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 233 - "Community 233"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 235 - "Community 235"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 236 - "Community 236"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 237 - "Community 237"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 238 - "Community 238"
Cohesion: 0.33
Nodes (6): DAYS, dryRun, [file, ...flags], parseCsv(), text, usage()

### Community 239 - "Community 239"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 240 - "Community 240"
Cohesion: 0.38
Nodes (5): ClosureInputErrors, closureStatus(), closureTarget(), validateClosureInput(), NOW

### Community 241 - "Community 241"
Cohesion: 0.38
Nodes (6): ScanConfidenceLevel, removePreview(), SCAN_LEVEL_COLORS, SCAN_PREVIEW_LAYER_IDS, setScanPreview(), toCollection()

### Community 242 - "Community 242"
Cohesion: 0.38
Nodes (4): LIBRARY_SHAPES, LUCIDE_VERSION, LEGACY_SHAPES, PictogramPart

### Community 243 - "Community 243"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 244 - "Community 244"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 245 - "Community 245"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 246 - "Community 246"
Cohesion: 0.47
Nodes (5): domainGraph(), filesIn(), functionsDir, root, specifiers()

### Community 247 - "Community 247"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 248 - "Community 248"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 249 - "Community 249"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 250 - "Community 250"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 251 - "Community 251"
Cohesion: 0.33
Nodes (5): [command, ...args], env, result, root, supabase

### Community 252 - "Community 252"
Cohesion: 0.33
Nodes (4): c, h, k, r

### Community 253 - "Community 253"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 254 - "Community 254"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 255 - "Community 255"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 256 - "Community 256"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 257 - "Community 257"
Cohesion: 0.40
Nodes (5): commit(), submit(), submit(), label(), draft()

### Community 258 - "Community 258"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 259 - "Community 259"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 260 - "Community 260"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 261 - "Community 261"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 263 - "Community 263"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

### Community 264 - "Community 264"
Cohesion: 0.40
Nodes (3): FeatureKindSchema, GeometrySchema, square

## Knowledge Gaps
- **9 isolated node(s):** `RFC-7946`, `RFC-6238`, `RFC-4180`, `RFC-9562`, `TARGETS` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2920 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **88 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 25` to `Community 32`, `Community 135`, `Community 39`, `Community 9`, `Community 10`, `Community 72`, `Community 109`, `Community 17`, `Community 50`, `Community 51`, `Community 19`, `Community 85`, `Community 91`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `RFC-7946`, `RFC-6238`, `RFC-4180` to the rest of the system?**
  _9 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.023875893831050782 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 2` to `Community 1`, `Community 129`, `Community 5`, `Community 9`, `Community 137`, `Community 10`, `Community 139`, `Community 138`, `Community 14`, `Community 16`, `Community 144`, `Community 19`, `Community 21`, `Community 22`, `Community 24`, `Community 25`, `Community 35`, `Community 164`, `Community 165`, `Community 38`, `Community 166`, `Community 39`, `Community 43`, `Community 48`, `Community 50`, `Community 58`, `Community 62`, `Community 66`, `Community 74`, `Community 77`, `Community 81`, `Community 210`, `Community 89`, `Community 91`, `Community 97`, `Community 100`, `Community 230`, `Community 231`, `Community 109`, `Community 122`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.029380095369943085 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 15` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 8`, `Community 137`, `Community 10`, `Community 13`, `Community 14`, `Community 16`, `Community 19`, `Community 21`, `Community 22`, `Community 155`, `Community 33`, `Community 35`, `Community 40`, `Community 41`, `Community 43`, `Community 173`, `Community 48`, `Community 50`, `Community 55`, `Community 58`, `Community 63`, `Community 65`, `Community 67`, `Community 69`, `Community 72`, `Community 80`, `Community 81`, `Community 82`, `Community 209`, `Community 213`, `Community 91`, `Community 92`, `Community 93`, `Community 100`, `Community 105`, `Community 109`, `Community 122`, `Community 127`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04897469458987783 - nodes in this community are weakly interconnected._