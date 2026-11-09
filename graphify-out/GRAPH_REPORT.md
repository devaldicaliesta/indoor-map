# Graph Report - indoor-map  (2026-11-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8160 nodes · 25830 edges · 286 communities (214 shown, 72 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 387 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0864a235`
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
- Community 218
- Community 219
- Community 221
- Community 222
- Community 223
- Community 224
- Community 225
- Community 226
- Community 230
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 238
- Community 242

## God Nodes (most connected - your core abstractions)
1. `Button()` - 264 edges
2. `VenueId` - 192 edges
3. `cn()` - 144 edges
4. `Input()` - 111 edges
5. `test` - 108 edges
6. `createRepositories()` - 99 edges
7. `toDataError()` - 93 edges
8. `FormNotice()` - 88 edges
9. `DataError` - 85 edges
10. `Skeleton()` - 75 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `VenueSelection` --references--> `VenueId`  [EXTRACTED]
  apps/admin/src/app/venue-store.ts → packages/domain/src/ids.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts
- `submit()` --indirect_call--> `position()`  [INFERRED]
  apps/admin/src/features/origin-points/origin-dialog.tsx → packages/routing/src/legs.ts

## Import Cycles
- None detected.

## Communities (286 total, 72 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (128): ColorField(), isColorValue(), Field(), others, TimezoneSelect(), VenuePicker(), AliasField(), FormNotice() (+120 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (98): RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+90 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (117): createAuthRepository(), signOut(), Json, Tables, TablesUpdate, CODE_RULES, CodeRule, DataError (+109 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (90): BrandGallery(), Section(), ContrastTable(), readToken(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage() (+82 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (109): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+101 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (69): slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, CONTEXT, VENUES, AIRLINES (+61 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (21): Fixtures, FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, TestVenue, unitSquare(), VisitorPage (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (81): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, AuthLayout() (+73 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (72): CategoriesRepository, CategoryRow, CategoryWithUsage, removeFile(), isUpload(), mapCategoryRow(), FieldRow, LocationTypesRepository (+64 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (84): useCurrentProfile(), DataTableGallery(), HomeRedirect(), INSTALLATION_MODULES, ModulePage(), ModuleRoute(), MODULE_NAV, ModuleNav (+76 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (84): EntranceField(), ANCHOR_OWNERS, Facts(), GraphProperties(), meters(), NODE_ROLE_LABELS, drawKindLabel(), drawKindValue() (+76 more)

### Community 11 - "Community 11"
Cohesion: 0.03
Nodes (39): settings, DataClient, AliasesRepository, ConnectorInput, ConnectorRow, ConnectorsRepository, isDirection(), isKind() (+31 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (77): submit(), SnapshotConnectorKind, SnapshotFeature, SnapshotFloor, SnapshotGraph, SnapshotInfoPoint, SnapshotOriginPoint, SnapshotPosition (+69 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (80): submit(), App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice() (+72 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (67): floors, gu, options, radiology, square, toilet, venueId, FloorTarget (+59 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (78): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), AdminTourButton(), LABELS, seenKey (+70 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (67): ConnectorDialogState, currentGraph(), GraphActions, useGraphActions(), OriginPointDraft, addEntrance(), attachAt(), clamp01() (+59 more)

### Community 18 - "Community 18"
Cohesion: 0.04
Nodes (57): Geometry, dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, COORDINATE_DECIMALS, EDIT_COLORS (+49 more)

### Community 19 - "Community 19"
Cohesion: 0.03
Nodes (57): page, json(), read(), results, root, DESKTOP, repoRoot, repoRoot (+49 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (68): FeatureKind, MapFeatureProperties, MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL (+60 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (69): ResetPasswordPage(), submit(), ActivationPage(), EulaChoice, InstanceId(), ManualForm(), OnlineForm(), STATE_NOTICE (+61 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (60): moveTo(), FIELD_PROBLEM_MESSAGES, FIELD_TYPE_LABELS, useTypeChoice(), change(), lostOnChange(), submit(), createVariedVenues() (+52 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (59): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+51 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (56): EntranceLayer(), IDLE, useEntranceStore, GraphLayer(), GraphStatus, graphSnapFeatures(), graphViews(), neighbourPositions() (+48 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (19): AdminShell, EditorPage, EditorTool, at(), drawUnit(), ring(), square(), unitsOn() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.06
Nodes (57): app.check_edge_same_floor(), app.check_unit_single_location(), app.on_venue_created(), app.release_units_on_permanent_close(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx (+49 more)

### Community 27 - "Community 27"
Cohesion: 0.04
Nodes (45): app.user_role(), audit_events_occurred_idx, public.audit_events, public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin (+37 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (56): crowdAreas(), floorCollection(), iconSpecs(), cache, DemoMap(), DemoVenue, snapshotOf(), SNAPSHOTS (+48 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (54): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+46 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (54): Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal(), FALLBACK_CENTER (+46 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (29): ACCOUNTS, currentLicenseId(), DEV_KEY, devLicenseFile(), releaseLicense(), resetCheckin(), restoreLicense(), runScheduledCheckin() (+21 more)

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (49): StepFocus, stepFocus(), useTestRoutePlan(), DEFAULT_INSTRUCTION_TEMPLATES, connector(), connectors, edge(), edges (+41 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (29): ACTIVITY_EVENTS, EditLockState, floorId, createEditLocksRepository(), acquire(), EditLocksRepository, Endpoint, LockRow (+21 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (41): NON_RETRYABLE, queryClient, DataClientConfig, DataErrorKind, aliasKey(), AliasRow, createAliasesRepository(), groupAliasRows() (+33 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (51): aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), ACTION_LABELS, ImportDialog(), choose(), PLAN_COLUMNS, RESULT_FILTER (+43 more)

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (48): PanelMessage(), Brand(), Logo(), MapArea(), VisitorShell(), LanguagePicker(), useSnapshot(), applyVenueLanguage() (+40 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (47): EditorSidebar(), ListTab, count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow() (+39 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 41 - "Community 41"
Cohesion: 0.06
Nodes (46): facility, index, snapshot, at(), gzipBytes(), largeVenue(), ring(), InsertedVenue (+38 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (29): env, envFile, PublishedVenue, globalSetup(), appServers, args, CI, projectArgs (+21 more)

### Community 43 - "Community 43"
Cohesion: 0.05
Nodes (51): DirectoryGroup, PolygonSchema, PositionSchema, hhmm(), isOpenAt(), localParts(), minutes(), OpeningHours (+43 more)

### Community 44 - "Community 44"
Cohesion: 0.09
Nodes (43): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, ClosurePlaces, fromVenueInput(), impactText(), offsetMs() (+35 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (37): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+29 more)

### Community 46 - "Community 46"
Cohesion: 0.08
Nodes (45): DemoRouteOptions, CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX, features (+37 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (42): RouteSources, submit(), passwordKey, settingsKey, useSaveSystemSettings(), useSendTestEmail(), useSmtpPasswordIsSet(), useSystemSettings() (+34 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (37): PlanBackground, Corners, areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers() (+29 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (29): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+21 more)

### Community 50 - "Community 50"
Cohesion: 0.08
Nodes (31): LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search(), waitForMail() (+23 more)

### Community 51 - "Community 51"
Cohesion: 0.08
Nodes (39): InstructionErrors, SAMPLE, SAMPLE_FLOOR, validateInstruction(), InstructionAction, InstructionText, CONNECTOR_ACTIONS, connectorSteps() (+31 more)

### Community 52 - "Community 52"
Cohesion: 0.08
Nodes (38): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+30 more)

### Community 53 - "Community 53"
Cohesion: 0.05
Nodes (47): lucide-react@catalog:, react-dom@catalog:, lucide-react, react-dom, react-dom@catalog:, lucide-react@catalog:, lucide-react@catalog:, react-dom@catalog: (+39 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (33): ClosedElements, closedElements(), ClosedElementsOptions, ClosureFeature, featureNodeIds(), polygonsOf(), ClosureImpact, closureImpact() (+25 more)

### Community 55 - "Community 55"
Cohesion: 0.08
Nodes (20): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+12 more)

### Community 56 - "Community 56"
Cohesion: 0.08
Nodes (37): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+29 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (35): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, hasBlockingFindings(), venueToday(), INACTIVE, activeSnapshot() (+27 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (29): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+21 more)

### Community 59 - "Community 59"
Cohesion: 0.11
Nodes (38): INSTRUCTION_ACTION_LABELS, SnapshotNavNode, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings() (+30 more)

### Community 60 - "Community 60"
Cohesion: 0.12
Nodes (33): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+25 more)

### Community 61 - "Community 61"
Cohesion: 0.06
Nodes (42): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+34 more)

### Community 62 - "Community 62"
Cohesion: 0.08
Nodes (34): count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle(), useVenueGraph(), NONE (+26 more)

### Community 63 - "Community 63"
Cohesion: 0.09
Nodes (25): EMPTY, RouteEndName, TestRouteState, DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds() (+17 more)

### Community 64 - "Community 64"
Cohesion: 0.06
Nodes (25): app.trial_venue(), hosting.trials, hosting.blocklist, hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+17 more)

### Community 65 - "Community 65"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 66 - "Community 66"
Cohesion: 0.08
Nodes (37): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, toPatch(), validate(), submit(), mapDisplaySettingsRow() (+29 more)

### Community 67 - "Community 67"
Cohesion: 0.06
Nodes (41): react-router@catalog:, tailwindcss@catalog:, @tailwindcss/vite@catalog:, react-router, tailwindcss, @tailwindcss/vite, tailwindcss@catalog:, @tailwindcss/vite@catalog: (+33 more)

### Community 68 - "Community 68"
Cohesion: 0.11
Nodes (34): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+26 more)

### Community 69 - "Community 69"
Cohesion: 0.08
Nodes (24): public.categories, public.facility_types, public.field_definitions, public.location_categories, public.location_types, public.locations, public.search_aliases, app.check_location_category_type() (+16 more)

### Community 70 - "Community 70"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 71 - "Community 71"
Cohesion: 0.06
Nodes (40): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, pdfjs-dist@catalog:, react@catalog:, zustand@catalog:, devDependencies, @biomejs/biome@catalog: (+32 more)

### Community 72 - "Community 72"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 73 - "Community 73"
Cohesion: 0.06
Nodes (15): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+7 more)

### Community 74 - "Community 74"
Cohesion: 0.06
Nodes (39): @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @types/react-dom@catalog:, @indoor/map-core, @indoor/routing, @types/react-dom, dependencies, @indoor/domain@workspace:* (+31 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (39): @indoor/ui@workspace:*, @tanstack/react-query@catalog:, @types/react@catalog:, @indoor/ui, @tanstack/react-query, @types/react, @types/react@catalog:, dependencies (+31 more)

### Community 76 - "Community 76"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 77 - "Community 77"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 78 - "Community 78"
Cohesion: 0.09
Nodes (12): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+4 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (14): capture(), shot(), capture(), shot(), perfEnv, tls, Violation, median() (+6 more)

### Community 80 - "Community 80"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 82 - "Community 82"
Cohesion: 0.11
Nodes (28): RouteFailure, routeFailure(), routeFloors(), stepTexts(), targetOfPlace(), graph, index, lobby (+20 more)

### Community 83 - "Community 83"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (35): @biomejs/biome, typescript, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+27 more)

### Community 85 - "Community 85"
Cohesion: 0.12
Nodes (31): hasOpeningHours(), INFO_POINT_ZOOM, infoPointSnapshot(), buildSnapshot(), byId(), isColor(), isFieldValue(), isHeight() (+23 more)

### Community 86 - "Community 86"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (28): requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems, State (+20 more)

### Community 88 - "Community 88"
Cohesion: 0.12
Nodes (27): SnapshotConnector, SnapshotNavEdge, at(), FLOORS, graphOf(), at(), CATEGORY_ID, DENSE_FLOOR (+19 more)

### Community 89 - "Community 89"
Cohesion: 0.09
Nodes (16): WithTooltip(), EditorToolbar(), HistoryButton(), TOOLS, EditorState, Direction, isTyping(), TOOL_BY_KEY (+8 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (27): submit(), changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formDraft(), formFloorIds(), initialForm() (+19 more)

### Community 91 - "Community 91"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 92 - "Community 92"
Cohesion: 0.11
Nodes (25): geometryOf(), RouteLayer(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), appliedColors, feature() (+17 more)

### Community 93 - "Community 93"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 94 - "Community 94"
Cohesion: 0.11
Nodes (22): toFeatureColumns(), areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema (+14 more)

### Community 95 - "Community 95"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 96 - "Community 96"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 97 - "Community 97"
Cohesion: 0.08
Nodes (16): LicenseRepository, PaidFeature, GRACE_DAYS, importTooLarge(), LicenseLimits, LicenseNotice, LIMIT_KINDS, LIMIT_LABELS (+8 more)

### Community 98 - "Community 98"
Cohesion: 0.14
Nodes (23): featureName(), featurePosition(), featureView(), OriginView, originView(), placeOfTarget(), index, snapshot (+15 more)

### Community 99 - "Community 99"
Cohesion: 0.13
Nodes (26): matchToken(), normalizeSearchText(), plainWords(), PreparedSearchEntry, prepareSearch(), queryTokens(), scoreEntry(), searchEntries() (+18 more)

### Community 100 - "Community 100"
Cohesion: 0.08
Nodes (15): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+7 more)

### Community 101 - "Community 101"
Cohesion: 0.16
Nodes (24): inVenueTime(), OUTDOOR, ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey(), historyKey() (+16 more)

### Community 102 - "Community 102"
Cohesion: 0.18
Nodes (22): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+14 more)

### Community 103 - "Community 103"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 104 - "Community 104"
Cohesion: 0.11
Nodes (15): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+7 more)

### Community 105 - "Community 105"
Cohesion: 0.08
Nodes (19): public.system_settings, app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, public.public_visitor_url(), app.server_settings (+11 more)

### Community 106 - "Community 106"
Cohesion: 0.16
Nodes (19): FacilityIconPreview(), FILTERS, Open, choiceSource(), FILE_MESSAGES, IconField(), pickFile(), PictogramPicker() (+11 more)

### Community 107 - "Community 107"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 108 - "Community 108"
Cohesion: 0.14
Nodes (20): RFC-2045, RFC-2387, addressOf(), base64(), base64Lines(), buildMessage(), Conn, connect() (+12 more)

### Community 109 - "Community 109"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 110 - "Community 110"
Cohesion: 0.13
Nodes (17): data, ClosureMarkData, closureMarks(), knownClosures(), base, snapshot, useClosureMap(), CLOSURE_REFRESH_MS (+9 more)

### Community 111 - "Community 111"
Cohesion: 0.14
Nodes (18): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), Prefetch, PrefetchHolder, take() (+10 more)

### Community 112 - "Community 112"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 113 - "Community 113"
Cohesion: 0.12
Nodes (18): FacilityTypesRepository, FacilityTypeWithUsage, FACILITY_TYPE_NAME_MAX, FacilityIconFileCheck, FacilityIconFileProblem, FacilityIconFormat, facilityIconPath(), FacilityType (+10 more)

### Community 114 - "Community 114"
Cohesion: 0.13
Nodes (13): capture(), shot(), Demo, createFullVenue(), Db, FullVenue, hoursRows(), insert() (+5 more)

### Community 115 - "Community 115"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 116 - "Community 116"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 117 - "Community 117"
Cohesion: 0.14
Nodes (20): BuildingType, hoursRows(), point(), VENUE_ROW_TABLES, VenueRow, VenueRows, venueRows(), VenueRowTable (+12 more)

### Community 118 - "Community 118"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 119 - "Community 119"
Cohesion: 0.12
Nodes (17): applyGraphPatch(), apply(), BASE, degree(), draw(), edgeList(), EMPTY, expectValid() (+9 more)

### Community 120 - "Community 120"
Cohesion: 0.18
Nodes (21): canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph(), FACILITY_ICON_COLORS, FACILITY_ICON_FALLBACK, FACILITY_ICON_PREFIX, facilityIconId() (+13 more)

### Community 121 - "Community 121"
Cohesion: 0.13
Nodes (16): accepted(), claim(), logError(), NoticeRow, release(), text(), HookPayload, url (+8 more)

### Community 122 - "Community 122"
Cohesion: 0.14
Nodes (14): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), ClosureMenu, ClosureTarget, graphElementAt(), createTapInteractions(), FLOOR_PICK_LAYERS (+6 more)

### Community 123 - "Community 123"
Cohesion: 0.18
Nodes (18): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+10 more)

### Community 124 - "Community 124"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 125 - "Community 125"
Cohesion: 0.20
Nodes (17): trialEnv(), trialSmtpConfig(), TRIAL_ENDED, activate(), Activation, adminUrl, getRequest(), logError() (+9 more)

### Community 126 - "Community 126"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 127 - "Community 127"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 128 - "Community 128"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 129 - "Community 129"
Cohesion: 0.18
Nodes (16): InviteInput, inviteScope(), Role, ROLES, activeSuperAdmin(), Caller, callerFromToken(), callerHeaders() (+8 more)

### Community 130 - "Community 130"
Cohesion: 0.12
Nodes (14): public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.take_over_edit_lock(), app.can_write_floor(), app.can_write_location(), app.can_write_location_type() (+6 more)

### Community 131 - "Community 131"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 132 - "Community 132"
Cohesion: 0.17
Nodes (14): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+6 more)

### Community 133 - "Community 133"
Cohesion: 0.10
Nodes (19): runs-on, steps, concurrency, cancel-in-progress, group, jobs, check, name (+11 more)

### Community 134 - "Community 134"
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 135 - "Community 135"
Cohesion: 0.13
Nodes (17): isCount(), isDate(), isText(), Json, knownKeys(), LicenseVerification, LicenseVerifyKey, OPTIONAL_QUOTA_KEYS (+9 more)

### Community 136 - "Community 136"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 137 - "Community 137"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 138 - "Community 138"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 139 - "Community 139"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 140 - "Community 140"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 141 - "Community 141"
Cohesion: 0.23
Nodes (17): BasemapUrlProblem, escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull(), point() (+9 more)

### Community 142 - "Community 142"
Cohesion: 0.18
Nodes (11): distanceM(), haversineM(), aStar(), MinHeap, gridGraph(), distance(), graphCost(), random() (+3 more)

### Community 143 - "Community 143"
Cohesion: 0.13
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 144 - "Community 144"
Cohesion: 0.18
Nodes (16): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), changeCount() (+8 more)

### Community 145 - "Community 145"
Cohesion: 0.20
Nodes (14): useVisitorTour(), RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), routeCache(), infoPointTour(), ShowSheet (+6 more)

### Community 146 - "Community 146"
Cohesion: 0.21
Nodes (17): LicenseQuota, body(), createVendorStub(), activate(), checkin(), renew(), revoke(), sign() (+9 more)

### Community 147 - "Community 147"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 148 - "Community 148"
Cohesion: 0.24
Nodes (13): home(), LanguageSwitch(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PrivacyPage(), apply() (+5 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 150 - "Community 150"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 151 - "Community 151"
Cohesion: 0.25
Nodes (13): EULA_VERSION, isEulaVersion(), needsEulaAcceptance(), ActivationError, createFirstAdmin(), eulaToRecord(), fromVendor(), handle() (+5 more)

### Community 152 - "Community 152"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 154 - "Community 154"
Cohesion: 0.20
Nodes (14): OUTCOMES, pending, postVerify(), RequestResult, retryVerify(), VerifyResult, verifyTrial(), visitorUrl (+6 more)

### Community 155 - "Community 155"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 156 - "Community 156"
Cohesion: 0.28
Nodes (15): trialDaysProblem(), CliError, count(), existingParent(), gitRoot(), inspect(), issue(), keygen() (+7 more)

### Community 157 - "Community 157"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 159 - "Community 159"
Cohesion: 0.21
Nodes (12): DirectoryFilterOptions, directoryFilterOptions(), directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER, OUTDOOR_FILTER (+4 more)

### Community 160 - "Community 160"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 161 - "Community 161"
Cohesion: 0.30
Nodes (11): infoPointsKey(), useRemoveInfoPoint(), useSaveInfoPoint(), originPointsKey(), SnapError, toChanges(), useOriginPoints(), useRemoveOriginPoint() (+3 more)

### Community 162 - "Community 162"
Cohesion: 0.21
Nodes (10): Db, DEMO_USERS, demoClosures(), demoEmail(), hoursFromNow(), RELEASE_NOTES, seedDemoUsers(), seedPublishHistory() (+2 more)

### Community 163 - "Community 163"
Cohesion: 0.31
Nodes (11): placeText(), takenMessage(), UnitLinks(), add(), addTyped(), onKeyDown(), UnitSelection, unitInfo() (+3 more)

### Community 164 - "Community 164"
Cohesion: 0.23
Nodes (9): floorGraph(), OriginMap(), ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID, originCollection(), originLayers(), OriginMarker (+1 more)

### Community 165 - "Community 165"
Cohesion: 0.21
Nodes (10): Choice(), Device, FRAMES, previewPath(), PREVIEW_READY, PREVIEW_SNAPSHOT, PreviewSnapshotMessage, withPreviewMode() (+2 more)

### Community 166 - "Community 166"
Cohesion: 0.18
Nodes (6): rootElement, router, NON_RETRYABLE, queryClient, rootElement, router

### Community 167 - "Community 167"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 168 - "Community 168"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 169 - "Community 169"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 170 - "Community 170"
Cohesion: 0.23
Nodes (12): fromBase64(), importLicensePublicKey(), LicenseRejection, verifyLicense(), askVendor(), checkIn(), CheckinFailure, Outcome (+4 more)

### Community 171 - "Community 171"
Cohesion: 0.36
Nodes (4): vite-plugin-pwa@catalog:, vite-plugin-pwa, thirdPartyNotices(), UI_FONT_NOTICES

### Community 172 - "Community 172"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 173 - "Community 173"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 174 - "Community 174"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 175 - "Community 175"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 176 - "Community 176"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 177 - "Community 177"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 178 - "Community 178"
Cohesion: 0.27
Nodes (8): useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard(), ROWS

### Community 179 - "Community 179"
Cohesion: 0.18
Nodes (6): DYNAMIC_PREFIXES, flatten(), languages, sources, Tree, usedKeys

### Community 180 - "Community 180"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 181 - "Community 181"
Cohesion: 0.27
Nodes (9): signedLicense(), paidLicense(), canonicalize(), licenseSigningBytes(), toBase64(), TRIAL_FEATURES, TRIAL_PLAN, NOW (+1 more)

### Community 182 - "Community 182"
Cohesion: 0.25
Nodes (8): LicenseFile, LICENSE_DEV_PUBLIC_KEY, LICENSE_PUBLIC_KEY, Issued, activate(), CheckinReply, issue(), post()

### Community 183 - "Community 183"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 184 - "Community 184"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 185 - "Community 185"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 186 - "Community 186"
Cohesion: 0.22
Nodes (10): environment, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY (+2 more)

### Community 187 - "Community 187"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 189 - "Community 189"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 190 - "Community 190"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 191 - "Community 191"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 192 - "Community 192"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 193 - "Community 193"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 194 - "Community 194"
Cohesion: 0.29
Nodes (6): EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 195 - "Community 195"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 196 - "Community 196"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 197 - "Community 197"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 199 - "Community 199"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 200 - "Community 200"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 201 - "Community 201"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 202 - "Community 202"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 203 - "Community 203"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 204 - "Community 204"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 205 - "Community 205"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 206 - "Community 206"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 207 - "Community 207"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 208 - "Community 208"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 209 - "Community 209"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 210 - "Community 210"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 211 - "Community 211"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 212 - "Community 212"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 213 - "Community 213"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 214 - "Community 214"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 216 - "Community 216"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `RFC-2045`, `RFC-2387`, `RFC-4180`, `TARGETS`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2385 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VenueId` connect `Community 11` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 15`, `Community 16`, `Community 145`, `Community 17`, `Community 21`, `Community 22`, `Community 23`, `Community 161`, `Community 34`, `Community 162`, `Community 33`, `Community 37`, `Community 165`, `Community 39`, `Community 38`, `Community 42`, `Community 44`, `Community 45`, `Community 47`, `Community 51`, `Community 52`, `Community 55`, `Community 62`, `Community 66`, `Community 90`, `Community 98`, `Community 101`, `Community 106`, `Community 110`, `Community 111`, `Community 113`, `Community 116`, `Community 119`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `RFC-2045`, `RFC-2387` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06432748538011696 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Community 38` to `Community 0`, `Community 98`, `Community 3`, `Community 67`, `Community 81`, `Community 49`, `Community 82`, `Community 145`, `Community 178`, `Community 23`, `Community 28`, `Community 29`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03226260918568611 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 0` to `Community 3`, `Community 4`, `Community 7`, `Community 9`, `Community 10`, `Community 13`, `Community 16`, `Community 144`, `Community 148`, `Community 21`, `Community 23`, `Community 24`, `Community 154`, `Community 29`, `Community 30`, `Community 163`, `Community 37`, `Community 165`, `Community 39`, `Community 38`, `Community 44`, `Community 47`, `Community 52`, `Community 56`, `Community 63`, `Community 68`, `Community 82`, `Community 87`, `Community 92`, `Community 98`, `Community 101`, `Community 102`, `Community 106`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.031135531135531136 - nodes in this community are weakly interconnected._