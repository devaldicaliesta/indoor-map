# Graph Report - indoor-map  (2026-11-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8288 nodes · 26012 edges · 299 communities (223 shown, 76 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 389 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5f5c675`
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
- Community 229
- Community 230
- Community 232
- Community 233
- Community 234
- Community 235
- Community 236
- Community 237
- Community 241
- Community 244
- Community 245
- Community 246
- Community 247
- Community 248
- Community 249
- Community 253

## God Nodes (most connected - your core abstractions)
1. `Button()` - 266 edges
2. `VenueId` - 192 edges
3. `cn()` - 144 edges
4. `Input()` - 111 edges
5. `test` - 108 edges
6. `createRepositories()` - 99 edges
7. `toDataError()` - 93 edges
8. `FormNotice()` - 90 edges
9. `DataError` - 85 edges
10. `Skeleton()` - 79 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `submit()` --indirect_call--> `position()`  [INFERRED]
  apps/admin/src/features/editor/connectors/connector-dialog.tsx → packages/routing/src/legs.ts
- `submit()` --indirect_call--> `idle()`  [INFERRED]
  apps/admin/src/features/info-points/info-point-dialog.tsx → e2e/tests/visitor/verify/T-104-map-core.spec.ts
- `submit()` --indirect_call--> `position()`  [INFERRED]
  apps/admin/src/features/info-points/info-point-dialog.tsx → packages/routing/src/legs.ts

## Import Cycles
- None detected.

## Communities (299 total, 76 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (149): ColorField(), isColorValue(), Field(), AliasField(), FormNotice(), ForgotPasswordPage(), floorLabel(), EndsForm() (+141 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (103): settings, RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema (+95 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (107): NON_RETRYABLE, queryClient, submit(), createAuthRepository(), signOut(), Tables, CODE_RULES, CodeRule (+99 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (103): submit(), ClosureMarkData, haversineM(), SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR (+95 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (112): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), HomeRedirect() (+104 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (31): test, TEST_CENTER, AdminShell, EditorPage, EditorTool, at(), drawUnit(), ring() (+23 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (114): at(), gzipBytes(), largeVenue(), ring(), InsertedVenue, PolygonSchema, PositionSchema, hasOpeningHours() (+106 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (86): move(), CategoriesRepository, CategoryRow, createLocationTypesRepository(), FieldRow, LocationTypesRepository, mapFieldRow(), mapLocationTypeRow() (+78 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (68): seedPublishHistory(), envFile, VENUES, CONTEXT, VENUES, AIRLINES, airportVenue(), FOOD (+60 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (98): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+90 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (62): DataClient, DataClientConfig, AliasesRepository, aliasKey(), AliasRow, groupAliasRows(), AuditRepository, OutdoorLayer (+54 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (90): SURFACES, TEXT_PAIRS, TOKENS, useFloorSelection(), UnitLocation(), CategoryChecklist(), CustomFieldInputs(), DAYS (+82 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (54): ACCOUNTS, env, envFile, Fixtures, FOOTPRINT, linkUnitsToPath(), PublishedVenue, TestVenue (+46 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (79): FeatureKind, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR, POINT_STYLE (+71 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (85): ContrastTable(), readToken(), UiGalleryPage(), submit(), BackupHistory(), Certificate(), LastBackup(), Row() (+77 more)

### Community 15 - "Community 15"
Cohesion: 0.05
Nodes (86): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+78 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (61): AccountMenu(), WithTooltip(), Providers(), EditorToolbar(), HistoryButton(), TOOLS, time, ACTIVITY_EVENTS (+53 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (70): data, inVenueTime(), useVenueSelection, venuesKey, aliasesKey(), PROBLEM_MESSAGES, useAliasDraft(), useConnectorDialog (+62 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (78): DEV_KEY, newDb(), signedLicense(), signIn(), DEV_KEY, newDb(), paidLicense(), signIn() (+70 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (67): others, TimezoneSelect(), VenuePicker(), ModuleNav, ROLE_LABELS, AREA_KINDS, targetKey(), TargetPicker() (+59 more)

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (68): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), useConnectors(), ClosureMenu, CONTROL_LABELS, EditorCanvas(), FALLBACK_CENTER (+60 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (67): DemoRouteOptions, snapHeight(), closureMarks(), useClosureMap(), CameraPadding, fitBearing(), focusCamera(), InitialCamera (+59 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (64): currentProfileKey, useAuthSync(), RequireAuth(), initialAuthRedirectHash, AuthLayout(), ACTIVITY_EVENTS, clearActivity(), markActivity() (+56 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (65): BrandGallery(), Section(), AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState (+57 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (61): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+53 more)

### Community 25 - "Community 25"
Cohesion: 0.07
Nodes (62): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+54 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (59): currentGraph(), GraphActions, useGraphActions(), addEntrance(), attachAt(), clamp01(), closestBetween(), firstPosition() (+51 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (55): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), VenueSpec, checkLocationTypeName(), CustomField, customFieldInput() (+47 more)

### Community 28 - "Community 28"
Cohesion: 0.07
Nodes (59): useEditorSession(), resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference() (+51 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (49): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+41 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (22): VenueSelection, FeaturesRepository, PublicationsRepository, createSnapshotsRepository(), SERVICE_INACTIVE, SnapshotsRepository, TRIAL_ENDED, VendorRepository (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (31): createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY, devLicenseFile(), releaseLicense() (+23 more)

### Community 32 - "Community 32"
Cohesion: 0.06
Nodes (59): FloorValidation, useFloorValidation(), MultiPolygon, areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon() (+51 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (49): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+41 more)

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (48): PanelMessage(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell() (+40 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (35): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, COORDINATE_DECIMALS, createFeatureEditor(), onClick() (+27 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (57): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react@catalog:, @types/react-dom@catalog: (+49 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (45): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, InstructionAction (+37 more)

### Community 39 - "Community 39"
Cohesion: 0.09
Nodes (44): placeOfTarget(), OriginChooser(), OriginRow(), OriginTapHint(), useOriginName(), RouteFailure, routeFailure(), routeFloors() (+36 more)

### Community 40 - "Community 40"
Cohesion: 0.05
Nodes (10): VisitorPage, createVariedVenues(), specs(), shot(), visitorSearch(), DESKTOP, repoRoot, collator (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (26): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+18 more)

### Community 42 - "Community 42"
Cohesion: 0.07
Nodes (45): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+37 more)

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (41): HOSTED_TRIAL_DAYS, compose(), Params, renderAuthEmail(), BRAND_LOGO, EMAIL_LOGO, emailHtml(), emailText() (+33 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (39): base, snapshot, index, snapshot, facility, index, none, snapshot (+31 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (35): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_code_unique, locations_release_units, public.categories, public.facility_types, public.field_definitions (+27 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (20): TestRouteState, SheetSnap, closure(), createExploreStore(), ExploreState, FocusMode, INITIAL, InitialExplore (+12 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (45): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+37 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (39): drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), createForUnit(), editorQueues(), graphSaveQueue() (+31 more)

### Community 49 - "Community 49"
Cohesion: 0.08
Nodes (35): createGraphInteractions(), onMove(), onUp(), preview(), snapped(), GraphInteractionOptions, EMPTY, graphCollection() (+27 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (21): appServers, args, CI, projectArgs, createFullVenue(), Db, hoursRows(), insert() (+13 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (39): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+31 more)

### Community 52 - "Community 52"
Cohesion: 0.06
Nodes (33): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.hook_password_verification_attempt() (+25 more)

### Community 53 - "Community 53"
Cohesion: 0.06
Nodes (44): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, react@catalog:, react-router@catalog: (+36 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (36): featureName(), featurePosition(), featureView(), OriginView, originView(), endPlace(), endTarget(), featureAt() (+28 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (32): DEFAULT_INSTRUCTION_TEMPLATES, ENTRANCES, unitIdOf(), planRoute(), FeatureParts, featureTarget(), infoPointTarget(), LocationParts (+24 more)

### Community 56 - "Community 56"
Cohesion: 0.06
Nodes (42): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+34 more)

### Community 57 - "Community 57"
Cohesion: 0.08
Nodes (37): privacyPage(), OUTCOMES, pending, postVerify(), RequestResult, requestTrial(), VerifyResult, visitorUrl (+29 more)

### Community 58 - "Community 58"
Cohesion: 0.10
Nodes (38): RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), loadSearch(), routeCache(), getCachedSearchIndex(), openDB() (+30 more)

### Community 59 - "Community 59"
Cohesion: 0.06
Nodes (42): react-dom@catalog:, react-dom, react-dom@catalog:, dependencies, class-variance-authority@catalog:, clsx@catalog:, driver.js@catalog:, @indoor/domain@workspace:* (+34 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (25): EditorState, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, isEmpty(), SaveSource, withPatch() (+17 more)

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (36): SnapshotPolygon, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+28 more)

### Community 63 - "Community 63"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 64 - "Community 64"
Cohesion: 0.09
Nodes (31): geometryOf(), RouteLayer(), routeOnFloors(), snapshot, VenueBrand, FOCUS_MIN_ZOOM, focusFeature(), focusZoom() (+23 more)

### Community 65 - "Community 65"
Cohesion: 0.05
Nodes (28): diagnoseWriteRejection(), sql(), json(), read(), results, root, repoRoot, settled() (+20 more)

### Community 66 - "Community 66"
Cohesion: 0.07
Nodes (24): ClosurePlaces, ConnectorDialogState, commit(), floorId, RouteSources, OriginPointDraft, Connector, CONNECTOR_KINDS (+16 more)

### Community 67 - "Community 67"
Cohesion: 0.09
Nodes (20): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+12 more)

### Community 68 - "Community 68"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 69 - "Community 69"
Cohesion: 0.09
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 70 - "Community 70"
Cohesion: 0.06
Nodes (34): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+26 more)

### Community 71 - "Community 71"
Cohesion: 0.07
Nodes (24): app.trial_venue(), hosting.trials, app.venue_locked(), hosting.blocklist, hosting.capacity(), hosting.trial_requests, public.hosting_request_get(), public.hosting_request_requeue() (+16 more)

### Community 72 - "Community 72"
Cohesion: 0.06
Nodes (21): app.can_access_floor(), app.can_access_location(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids(), app.all_venues_user() (+13 more)

### Community 73 - "Community 73"
Cohesion: 0.10
Nodes (26): RFC-2045, RFC-2387, HookPayload, addressOf(), base64(), base64Lines(), buildMessage(), Conn (+18 more)

### Community 74 - "Community 74"
Cohesion: 0.06
Nodes (36): @biomejs/biome, typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports (+28 more)

### Community 75 - "Community 75"
Cohesion: 0.08
Nodes (24): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+16 more)

### Community 76 - "Community 76"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 77 - "Community 77"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 78 - "Community 78"
Cohesion: 0.14
Nodes (29): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, fromVenueInput(), impactText(), offsetMs(), targetLabel() (+21 more)

### Community 79 - "Community 79"
Cohesion: 0.09
Nodes (25): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+17 more)

### Community 80 - "Community 80"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 81 - "Community 81"
Cohesion: 0.09
Nodes (26): createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload(), checkIconPng(), createFacilityTypesRepository(), inUseError() (+18 more)

### Community 82 - "Community 82"
Cohesion: 0.12
Nodes (29): BrandingPreview(), CHIPS, Mark(), RouteSketch(), BrandingForm(), BrandingPanel(), LogoDraft, LogoField() (+21 more)

### Community 83 - "Community 83"
Cohesion: 0.11
Nodes (27): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, createDisplaySettingsRepository(), DisplaySettingsRow, mapDisplaySettingsRow(), row (+19 more)

### Community 84 - "Community 84"
Cohesion: 0.12
Nodes (21): page, vite-plugin-pwa@catalog:, vite-plugin-pwa, [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label() (+13 more)

### Community 85 - "Community 85"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 86 - "Community 86"
Cohesion: 0.12
Nodes (27): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, hasBlockingFindings(), venueToday(), activeSnapshot(), activeVersion() (+19 more)

### Community 87 - "Community 87"
Cohesion: 0.09
Nodes (24): EntranceField(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton(), meters (+16 more)

### Community 88 - "Community 88"
Cohesion: 0.09
Nodes (16): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+8 more)

### Community 89 - "Community 89"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 90 - "Community 90"
Cohesion: 0.15
Nodes (30): canvasArea(), connectorColor(), drawPlan(), strokeRoute(), deskAndMonitor(), LOBBY, lobby(), screenQuad() (+22 more)

### Community 91 - "Community 91"
Cohesion: 0.14
Nodes (23): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+15 more)

### Community 92 - "Community 92"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 93 - "Community 93"
Cohesion: 0.09
Nodes (16): createEditLocksRepository(), acquire(), EditLocksRepository, Endpoint, LockRow, mapLockRow(), InfoPointsRepository, EDIT_LOCK_HEARTBEAT_MS (+8 more)

### Community 94 - "Community 94"
Cohesion: 0.12
Nodes (25): LicenseRejection, InviteInput, inviteScope(), Role, ROLES, askVendor(), checkIn(), CheckinFailure (+17 more)

### Community 95 - "Community 95"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 96 - "Community 96"
Cohesion: 0.10
Nodes (26): copy(), Disks(), alertText(), date, dateTime, sentence(), SERVICE_STATES, serviceStateText() (+18 more)

### Community 97 - "Community 97"
Cohesion: 0.14
Nodes (24): ConnectorPanel(), ANCHOR_OWNERS, Facts(), GraphProperties(), meters(), NODE_ROLE_LABELS, drawKindLabel(), FEATURE_KIND_LABELS (+16 more)

### Community 98 - "Community 98"
Cohesion: 0.14
Nodes (25): useNow(), PlaceDisplay, floorText(), KIND_ORDER, placeKey(), PlaceKind, placeName(), PlaceOption (+17 more)

### Community 99 - "Community 99"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 100 - "Community 100"
Cohesion: 0.12
Nodes (24): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+16 more)

### Community 101 - "Community 101"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 102 - "Community 102"
Cohesion: 0.11
Nodes (21): svgToPng(), CadDraft, useCadFile(), open(), CadInspection, checkFloorPlanPlacement(), defaultCadLayers(), EXTENSION_FORMATS (+13 more)

### Community 103 - "Community 103"
Cohesion: 0.13
Nodes (25): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+17 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (22): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+14 more)

### Community 105 - "Community 105"
Cohesion: 0.13
Nodes (17): LoginPage, contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openLocations() (+9 more)

### Community 106 - "Community 106"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 107 - "Community 107"
Cohesion: 0.13
Nodes (13): BuildingsRepository, FloorsRepository, Building, BuildingInput, BuildingInputProblem, Floor, FLOOR_HEIGHT_RANGE, FloorInput (+5 more)

### Community 108 - "Community 108"
Cohesion: 0.12
Nodes (21): EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), accepted(), claim(), logError(), NoticeRow, release() (+13 more)

### Community 109 - "Community 109"
Cohesion: 0.08
Nodes (26): @indoor/routing@workspace:*, @indoor/routing, dependencies, @indoor/domain@workspace:*, @indoor/routing@workspace:*, lucide-react@catalog:, react@catalog:, react-dom@catalog: (+18 more)

### Community 110 - "Community 110"
Cohesion: 0.10
Nodes (21): PlanBackground, EDIT_COLORS, Corners, FLOOR_PLAN_LAYER_ID, FloorPlanImage, ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID (+13 more)

### Community 111 - "Community 111"
Cohesion: 0.09
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.has_verified_totp(), app.mfa_recovery_codes, app.mfa_required_roles(), app.user_role() (+7 more)

### Community 112 - "Community 112"
Cohesion: 0.08
Nodes (26): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name, runs-on (+18 more)

### Community 113 - "Community 113"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 114 - "Community 114"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 115 - "Community 115"
Cohesion: 0.14
Nodes (23): ABOVE, ISSUE_COLOR, ISSUE_LAYER_IDS, setIssueHighlight(), canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph() (+15 more)

### Community 116 - "Community 116"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 117 - "Community 117"
Cohesion: 0.15
Nodes (17): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), useSnapshot(), Prefetch, PrefetchHolder (+9 more)

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 119 - "Community 119"
Cohesion: 0.15
Nodes (21): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+13 more)

### Community 120 - "Community 120"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 121 - "Community 121"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 122 - "Community 122"
Cohesion: 0.15
Nodes (15): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+7 more)

### Community 123 - "Community 123"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 124 - "Community 124"
Cohesion: 0.10
Nodes (21): dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:*, react@catalog:, react-dom@catalog:, vite@catalog:, vitest@catalog:, react (+13 more)

### Community 125 - "Community 125"
Cohesion: 0.18
Nodes (17): useVisitorTour(), BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap() (+9 more)

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
Cohesion: 0.11
Nodes (19): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, typescript@catalog:, vitest@catalog:, exports (+11 more)

### Community 130 - "Community 130"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 131 - "Community 131"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 132 - "Community 132"
Cohesion: 0.16
Nodes (15): CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, formDraft(), formFloorIds(), FormPlace, initialForm(), levelOf(), BUILDINGS (+7 more)

### Community 133 - "Community 133"
Cohesion: 0.12
Nodes (17): saveValid(), file(), { chromium }, envFile, locationId(), OUT, require, rest() (+9 more)

### Community 134 - "Community 134"
Cohesion: 0.16
Nodes (17): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+9 more)

### Community 135 - "Community 135"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 136 - "Community 136"
Cohesion: 0.26
Nodes (14): home(), LanguageSwitch(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root, PrivacyPage() (+6 more)

### Community 137 - "Community 137"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 138 - "Community 138"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 139 - "Community 139"
Cohesion: 0.16
Nodes (13): toFeatureColumns(), areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema (+5 more)

### Community 140 - "Community 140"
Cohesion: 0.16
Nodes (14): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+6 more)

### Community 141 - "Community 141"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 142 - "Community 142"
Cohesion: 0.13
Nodes (13): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+5 more)

### Community 143 - "Community 143"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 144 - "Community 144"
Cohesion: 0.18
Nodes (13): pdfjs-dist@catalog:, usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+5 more)

### Community 145 - "Community 145"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 146 - "Community 146"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 147 - "Community 147"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 148 - "Community 148"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 150 - "Community 150"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 151 - "Community 151"
Cohesion: 0.15
Nodes (9): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.take_over_edit_lock() (+1 more)

### Community 152 - "Community 152"
Cohesion: 0.26
Nodes (12): isEulaVersion(), needsEulaAcceptance(), ActivationError, createFirstAdmin(), eulaToRecord(), fromVendor(), handle(), install() (+4 more)

### Community 153 - "Community 153"
Cohesion: 0.30
Nodes (15): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), mixdown() (+7 more)

### Community 155 - "Community 155"
Cohesion: 0.19
Nodes (10): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+2 more)

### Community 156 - "Community 156"
Cohesion: 0.30
Nodes (10): iconSpecs(), categoryIconSpecs(), facilityIconSpecs(), mapCategoryRow(), parseFacilityIcon(), categoryIconTypeId(), FacilityIconSpec, categoryUnitColors() (+2 more)

### Community 157 - "Community 157"
Cohesion: 0.20
Nodes (9): ConnectorInput, ConnectorRow, ConnectorsRepository, isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft (+1 more)

### Community 158 - "Community 158"
Cohesion: 0.24
Nodes (9): SearchField(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard() (+1 more)

### Community 159 - "Community 159"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 160 - "Community 160"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 161 - "Community 161"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 162 - "Community 162"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 163 - "Community 163"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 164 - "Community 164"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 165 - "Community 165"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 166 - "Community 166"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 167 - "Community 167"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 168 - "Community 168"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 169 - "Community 169"
Cohesion: 0.18
Nodes (8): admin(), anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 170 - "Community 170"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 171 - "Community 171"
Cohesion: 0.27
Nodes (10): content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence(), unsubscribeUrl() (+2 more)

### Community 172 - "Community 172"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 173 - "Community 173"
Cohesion: 0.18
Nodes (6): DYNAMIC_PREFIXES, flatten(), languages, sources, Tree, usedKeys

### Community 174 - "Community 174"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 175 - "Community 175"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 176 - "Community 176"
Cohesion: 0.20
Nodes (7): floors, gu, options, radiology, square, toilet, venueId

### Community 177 - "Community 177"
Cohesion: 0.33
Nodes (6): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText()

### Community 178 - "Community 178"
Cohesion: 0.22
Nodes (10): environment, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY (+2 more)

### Community 179 - "Community 179"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 180 - "Community 180"
Cohesion: 0.38
Nodes (7): Cell, cell(), CellQueue, centroidCell(), labelPoint(), segmentDistanceSq(), signedDistance()

### Community 181 - "Community 181"
Cohesion: 0.29
Nodes (8): areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers(), ClosureMarks, setClosureMarks()

### Community 182 - "Community 182"
Cohesion: 0.20
Nodes (7): { chromium }, EMBLEMS, font, LOGOS, out, require, root

### Community 183 - "Community 183"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 186 - "Community 186"
Cohesion: 0.28
Nodes (7): LanguagePicker(), applyVenueLanguage(), readStoredLanguage(), setLanguage(), LANGUAGE_CODES, resolveLanguage(), toLanguageCode()

### Community 187 - "Community 187"
Cohesion: 0.36
Nodes (5): failure, useMapAvailable(), detectWebGL(), supportsWebGL(), WebGLProbeCanvas

### Community 188 - "Community 188"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 189 - "Community 189"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

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
Cohesion: 0.36
Nodes (7): Db, DEMO_USERS, demoClosures(), demoEmail(), hoursFromNow(), RELEASE_NOTES, seedDemoUsers()

### Community 195 - "Community 195"
Cohesion: 0.29
Nodes (6): EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 196 - "Community 196"
Cohesion: 0.39
Nodes (6): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota

### Community 197 - "Community 197"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 198 - "Community 198"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 199 - "Community 199"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

### Community 200 - "Community 200"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 201 - "Community 201"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 202 - "Community 202"
Cohesion: 0.33
Nodes (4): NON_RETRYABLE, queryClient, rootElement, router

### Community 203 - "Community 203"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 205 - "Community 205"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 206 - "Community 206"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 208 - "Community 208"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 209 - "Community 209"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 210 - "Community 210"
Cohesion: 0.43
Nodes (4): vendor.checkins, vendor.clients, vendor.installations, vendor.licenses

### Community 211 - "Community 211"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 212 - "Community 212"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 213 - "Community 213"
Cohesion: 0.47
Nodes (5): domainGraph(), filesIn(), functionsDir, root, specifiers()

### Community 214 - "Community 214"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 216 - "Community 216"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 218 - "Community 218"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 219 - "Community 219"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 221 - "Community 221"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 222 - "Community 222"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 224 - "Community 224"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 226 - "Community 226"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `TARGETS`, `RFC-4180`, `RFC-2045`, `RFC-2387`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **76 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VenueId` connect `Community 30` to `Community 0`, `Community 1`, `Community 2`, `Community 132`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 14`, `Community 17`, `Community 19`, `Community 20`, `Community 24`, `Community 26`, `Community 27`, `Community 29`, `Community 157`, `Community 35`, `Community 38`, `Community 48`, `Community 176`, `Community 51`, `Community 54`, `Community 58`, `Community 66`, `Community 67`, `Community 194`, `Community 78`, `Community 81`, `Community 82`, `Community 83`, `Community 88`, `Community 93`, `Community 98`, `Community 107`, `Community 117`, `Community 120`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `TARGETS`, `RFC-4180` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04751027866605756 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 0` to `Community 4`, `Community 134`, `Community 136`, `Community 9`, `Community 11`, `Community 14`, `Community 16`, `Community 17`, `Community 19`, `Community 20`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 35`, `Community 39`, `Community 54`, `Community 57`, `Community 64`, `Community 199`, `Community 78`, `Community 82`, `Community 87`, `Community 91`, `Community 97`, `Community 98`, `Community 104`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.025850785340314136 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Community 25` to `Community 0`, `Community 35`, `Community 37`, `Community 39`, `Community 76`, `Community 19`, `Community 53`, `Community 54`, `Community 21`, `Community 24`, `Community 186`, `Community 125`, `Community 158`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.027863200074550367 - nodes in this community are weakly interconnected._