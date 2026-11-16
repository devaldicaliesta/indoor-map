# Graph Report - indoor-map  (2026-11-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 9423 nodes · 30163 edges · 338 communities (251 shown, 87 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 483 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `272306fe`
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
- Community 255
- Community 256
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
- Community 268
- Community 269
- Community 273
- Community 276
- Community 277
- Community 278
- Community 279
- Community 280
- Community 281
- Community 282
- Community 286

## God Nodes (most connected - your core abstractions)
1. `Button()` - 320 edges
2. `VenueId` - 222 edges
3. `cn()` - 148 edges
4. `Input()` - 134 edges
5. `test` - 125 edges
6. `toDataError()` - 108 edges
7. `createRepositories()` - 106 edges
8. `FormNotice()` - 99 edges
9. `Label()` - 95 edges
10. `DataError` - 93 edges

## Surprising Connections (you probably didn't know these)
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `accept()` --calls--> `checkImageFile()`  [EXTRACTED]
  apps/admin/src/features/locations/location-images.tsx → packages/domain/src/image.ts
- `submit()` --indirect_call--> `floorName()`  [INFERRED]
  apps/admin/src/features/origin-points/board-dialogs.tsx → tests/perf/src/large-venue.ts

## Import Cycles
- None detected.

## Communities (338 total, 87 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (100): createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, TablesInsert (+92 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (38): FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, unitSquare(), AdminShell, EditorPage, EditorTool (+30 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (124): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), inVenueTime() (+116 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (120): MapLabel, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, EDIT_COLORS, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR (+112 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (126): ContrastTable(), Providers(), submit(), BackupHistory(), rootElement, router, App(), Gate (+118 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (102): Tables, TablesUpdate, CODE_RULES, CodeRule, DataError, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES (+94 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (97): submit(), haversineM(), SnapshotGraph, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs, nodeDistanceM() (+89 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (103): useVenueSelection, venuesKey, FormNotice(), ForgotPasswordPage(), ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog (+95 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (103): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+95 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (79): AccountMenu(), AppLayout(), NarrowScreenNotice(), subscribe(), FeatureItem(), ItemBody(), ModuleItem(), NavItem() (+71 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (97): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+89 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (67): envFile, VENUES, CONTEXT, VENUES, AIRLINES, airportVenue(), FOOD, RETAIL (+59 more)

### Community 12 - "Community 12"
Cohesion: 0.04
Nodes (42): env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY (+34 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (97): BrandGallery(), Section(), readToken(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage(), useFloorSelection() (+89 more)

### Community 14 - "Community 14"
Cohesion: 0.03
Nodes (68): NON_RETRYABLE, queryClient, Attempt, DataClient, DataClientConfig, fromFunctionError(), AliasesRepository, AnalyticsConfig (+60 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (93): InsertedVenue, hasOpeningHours(), PREVIEW_READY, PREVIEW_SNAPSHOT, PreviewSnapshotMessage, byId(), isColor(), isFieldValue() (+85 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (86): loadCrowd(), crowdAreas(), useCrowdMap(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson() (+78 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (66): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), ConnectorPanel(), ClosureMenu, CONTROL_LABELS, EditorCanvas(), FALLBACK_CENTER (+58 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (68): shownFloorOf(), snapHeight(), useClosureMap(), eventPositions(), Placed, useEventMap(), CameraPadding, fitBearing() (+60 more)

### Community 19 - "Community 19"
Cohesion: 0.04
Nodes (16): VisitorPage, createVariedVenues(), specs(), shot(), visitorSearch(), shot(), visitorLabel(), TILE_PNG (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (52): Georeferencer, LngLat, createGraphInteractions(), onMove(), onUp(), preview(), snapped(), GraphInteractionOptions (+44 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (67): exportMap(), save(), slug(), download(), boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf() (+59 more)

### Community 22 - "Community 22"
Cohesion: 0.04
Nodes (56): ClosureMarkData, closureMarks(), base, snapshot, facility, index, snapshot, graph (+48 more)

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (60): currentProfileKey, useAuthSync(), RequireAuth(), AuthLayout(), ACTIVITY_EVENTS, clearActivity(), markActivity(), readLastActivity() (+52 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (58): ColorField(), isColorValue(), Field(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FacilityTypeDialog() (+50 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (65): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+57 more)

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (57): licenseFileName(), HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice() (+49 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (64): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+56 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (53): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+45 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (53): data, initialAuthRedirectHash, flushEditor(), useClosureNetwork(), useClosurePage(), useConnectors(), EditorSidebar(), ListTab (+45 more)

### Community 30 - "Community 30"
Cohesion: 0.06
Nodes (54): TestRouteState, DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), stepTexts() (+46 more)

### Community 31 - "Community 31"
Cohesion: 0.04
Nodes (48): fetchAllPages(), listPage(), PAGE_SIZE, pageRange(), PageResponse, aliasKey(), AliasRow, createAliasesRepository() (+40 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (54): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+46 more)

### Community 33 - "Community 33"
Cohesion: 0.06
Nodes (53): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, InstructionAction (+45 more)

### Community 34 - "Community 34"
Cohesion: 0.06
Nodes (54): BasemapUrlProblem, escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES (+46 more)

### Community 35 - "Community 35"
Cohesion: 0.05
Nodes (62): dependencies, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, react-dom@catalog:, react-router@catalog:, @tanstack/react-query@catalog: (+54 more)

### Community 36 - "Community 36"
Cohesion: 0.04
Nodes (36): BlockEntry, createVendorClientsRepository(), Functions, LicenseRow, NewVendorClient, NewVendorInstallation, readLicenseFile(), toLicense() (+28 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (54): canonicalize(), fromBase64(), importLicensePublicKey(), isCount(), isDate(), VendorLicense, isText(), Json (+46 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (45): ConnectorDialog(), ConnectorFormBody(), submit(), ConnectorDialogState, useConnectorDialog, changeKind(), CONNECTOR_KIND_LABELS, CONNECTOR_PROBLEM_MESSAGES (+37 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (53): floorLabel(), impactText(), offsetMs(), targetLabel(), places, zoneParts(), Events(), isKind() (+45 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (48): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+40 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (48): drawKindLabel(), drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), createForUnit(), editorQueues() (+40 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (50): CommitInput(), commit(), HeightField(), MESSAGES, number, submit(), LogoChange, useSaveBranding() (+42 more)

### Community 44 - "Community 44"
Cohesion: 0.05
Nodes (43): DEFAULT_INSTRUCTION_TEMPLATES, connector(), connectors, edge(), edges, ENTRANCES, escalatorDown, escalatorUp (+35 more)

### Community 45 - "Community 45"
Cohesion: 0.09
Nodes (46): useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell(), knownClosures() (+38 more)

### Community 46 - "Community 46"
Cohesion: 0.05
Nodes (19): VenueSelection, FeaturesRepository, PublicationsRepository, SnapshotsRepository, VenuesRepository, Building, ConnectorStop, DisplayMode (+11 more)

### Community 47 - "Community 47"
Cohesion: 0.10
Nodes (44): PanelMessage(), data, EventDetail(), EventList(), EventRow(), KindBadge(), LiveBadge(), LocationEvents() (+36 more)

### Community 48 - "Community 48"
Cohesion: 0.07
Nodes (36): RFC-6238, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+28 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (48): columns, dateTime, LicenseHistory(), SOURCE_LABELS, Banner(), CheckinNotice(), date, LicenseNotice() (+40 more)

### Community 50 - "Community 50"
Cohesion: 0.05
Nodes (35): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.hook_password_verification_attempt() (+27 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (26): appServers, args, CI, projectArgs, capture(), shot(), createFullVenue(), Db (+18 more)

### Community 52 - "Community 52"
Cohesion: 0.07
Nodes (31): ClosurePlaces, combinedSave(), EditorPatch, EditorState, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE (+23 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (38): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+30 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (28): public.hosting_queue_next(), hosting.vendor_actions, vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create() (+20 more)

### Community 55 - "Community 55"
Cohesion: 0.05
Nodes (49): tailwindcss@catalog:, @types/react@catalog:, @vitejs/plugin-react@catalog:, tailwindcss, @types/react, @types/react-dom, @vitejs/plugin-react, react@catalog: (+41 more)

### Community 56 - "Community 56"
Cohesion: 0.07
Nodes (36): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+28 more)

### Community 57 - "Community 57"
Cohesion: 0.14
Nodes (38): EntityIcon(), ListRow(), formatDate(), LocationStatus(), locationKindText(), locationSubtitle(), placeText(), failure (+30 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (25): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+17 more)

### Community 59 - "Community 59"
Cohesion: 0.06
Nodes (30): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, three@catalog:, COORDINATE_DECIMALS, createFeatureEditor() (+22 more)

### Community 60 - "Community 60"
Cohesion: 0.06
Nodes (21): unit(), SheetSnap, closure(), createExploreStore(), ExploreList, ExploreState, FocusMode, INITIAL (+13 more)

### Community 61 - "Community 61"
Cohesion: 0.09
Nodes (35): useVisitorTour(), PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, AnalyticsQueue, choice, choosePrivacy() (+27 more)

### Community 62 - "Community 62"
Cohesion: 0.06
Nodes (18): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, createAuthRepository() (+10 more)

### Community 63 - "Community 63"
Cohesion: 0.11
Nodes (39): SnapshotGeometry, SnapshotNavNode, SnapshotPolygon, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings() (+31 more)

### Community 64 - "Community 64"
Cohesion: 0.12
Nodes (36): onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role, ROLES, activeSuperAdmin(), Caller (+28 more)

### Community 65 - "Community 65"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 66 - "Community 66"
Cohesion: 0.09
Nodes (33): WithTooltip(), PlanBackground, Editor(), footprintCenter(), useActivePlan(), useStepFloor(), EditorToolbar(), HistoryButton() (+25 more)

### Community 67 - "Community 67"
Cohesion: 0.09
Nodes (16): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+8 more)

### Community 68 - "Community 68"
Cohesion: 0.08
Nodes (35): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+27 more)

### Community 69 - "Community 69"
Cohesion: 0.10
Nodes (34): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+26 more)

### Community 70 - "Community 70"
Cohesion: 0.08
Nodes (29): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.facility_types, public.field_definitions, public.location_categories (+21 more)

### Community 71 - "Community 71"
Cohesion: 0.06
Nodes (25): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+17 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (36): RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), loadSearch(), NO_STOPS, getCachedSearchIndex(), openDB() (+28 more)

### Community 73 - "Community 73"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 74 - "Community 74"
Cohesion: 0.09
Nodes (36): TRIAL_FEATURES, TRIAL_MIN_DAYS, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal(), OnPremTrialRequest (+28 more)

### Community 75 - "Community 75"
Cohesion: 0.07
Nodes (33): endPlace(), endTarget(), featureAt(), placeEnd(), SharedState, sharedState(), roundTrip(), decodeDeepLink() (+25 more)

### Community 76 - "Community 76"
Cohesion: 0.08
Nodes (25): LocationsRepository, customFieldInput(), UnitStatus, LocationId, IMPORT_STANDARD_COLUMNS, ImportContext, ImportPlan, ImportRow (+17 more)

### Community 77 - "Community 77"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 79 - "Community 79"
Cohesion: 0.10
Nodes (30): LICENSE_ID, validUntil(), DEV_KEY, newDb(), signedLicense(), signIn(), DEV_KEY, newDb() (+22 more)

### Community 80 - "Community 80"
Cohesion: 0.10
Nodes (35): checkGlb(), checkModelPlacement(), GLB_MIME, GLB_PROBLEM_MESSAGES, GlbProblem, inRange(), latin1(), LibraryModel (+27 more)

### Community 81 - "Community 81"
Cohesion: 0.08
Nodes (31): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID, originCollection() (+23 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (38): dependencies, class-variance-authority@catalog:, clsx@catalog:, driver.js@catalog:, @indoor/domain@workspace:*, radix-ui@catalog:, sonner@catalog:, tailwind-merge@catalog: (+30 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 84 - "Community 84"
Cohesion: 0.08
Nodes (19): ACCOUNTS, PublishedVenue, TestVenue, globalSetup(), RoleTargets, SERVER_ATTEMPTS, SQUARE, capture() (+11 more)

### Community 85 - "Community 85"
Cohesion: 0.09
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), checkTable(), IMPORT_HEADER, shot(), capture() (+6 more)

### Community 86 - "Community 86"
Cohesion: 0.09
Nodes (32): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+24 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (31): english(), locationDescription(), DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace() (+23 more)

### Community 88 - "Community 88"
Cohesion: 0.08
Nodes (24): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+16 more)

### Community 89 - "Community 89"
Cohesion: 0.07
Nodes (22): EventSave, blank(), createEventsRepository(), get(), setLocations(), dayStart(), EventListState, EventPageFilters (+14 more)

### Community 90 - "Community 90"
Cohesion: 0.10
Nodes (25): key(), listWithUrls(), useFloorPlans(), useUploadFloorPlan(), candidateLabels(), CandidateList(), KIND_LABELS, Results() (+17 more)

### Community 91 - "Community 91"
Cohesion: 0.08
Nodes (26): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target (+18 more)

### Community 92 - "Community 92"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 93 - "Community 93"
Cohesion: 0.14
Nodes (27): VenueSpec, fieldKeyFromLabel(), PictogramKey, airportStation, campus, custom, factoryWarehouse, hospital (+19 more)

### Community 94 - "Community 94"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 95 - "Community 95"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 96 - "Community 96"
Cohesion: 0.09
Nodes (31): mapCategoryRow(), customFieldsOf(), FloorEmbed, hoursToRows(), IMAGE_EXTENSIONS, IMPORT_BATCH, LocationPageFilters, LocationRow (+23 more)

### Community 97 - "Community 97"
Cohesion: 0.08
Nodes (22): hosting.trials, hosting.blocklist, hosting.capacity(), hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+14 more)

### Community 98 - "Community 98"
Cohesion: 0.06
Nodes (34): fflate@^0.8.3, react@catalog:, devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react-dom@catalog: (+26 more)

### Community 99 - "Community 99"
Cohesion: 0.10
Nodes (29): privacyPage(), requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems (+21 more)

### Community 100 - "Community 100"
Cohesion: 0.12
Nodes (29): iconSpecs(), categoryIconSpecs(), facilityIconSpecs(), parseFacilityIcon(), canvas2d(), categoryIconTypeId(), drawBadge(), drawGlyph() (+21 more)

### Community 101 - "Community 101"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 102 - "Community 102"
Cohesion: 0.13
Nodes (19): page, [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice (+11 more)

### Community 103 - "Community 103"
Cohesion: 0.08
Nodes (21): i18next@catalog:, NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage() (+13 more)

### Community 104 - "Community 104"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 105 - "Community 105"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 106 - "Community 106"
Cohesion: 0.15
Nodes (28): attachAt(), clamp01(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph(), nearestOnOutline() (+20 more)

### Community 107 - "Community 107"
Cohesion: 0.11
Nodes (26): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+18 more)

### Community 108 - "Community 108"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 109 - "Community 109"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 110 - "Community 110"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 111 - "Community 111"
Cohesion: 0.09
Nodes (18): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), app.block_publish_over_quota(), app.sync_service_trigger() (+10 more)

### Community 112 - "Community 112"
Cohesion: 0.11
Nodes (22): move(), checkLocationTypeName(), BuildingId, FeatureId, CATEGORY_NAME_MAX, checkCategoryName(), checkLocationCode(), checkLocationInput() (+14 more)

### Community 113 - "Community 113"
Cohesion: 0.09
Nodes (18): createAnalyticsRepository(), CadLayer, CadRender, createCadConverterRepository(), post(), DXF, Messages, SCAN (+10 more)

### Community 114 - "Community 114"
Cohesion: 0.12
Nodes (23): parseModelRef(), createModelsLayer(), rebuild(), report(), placeModels(), libraryModel(), loadThreeLayer(), MODELS_LAYER_ID (+15 more)

### Community 115 - "Community 115"
Cohesion: 0.09
Nodes (21): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+13 more)

### Community 116 - "Community 116"
Cohesion: 0.09
Nodes (24): FACILITY_TYPE_NAME_MAX, FacilityIconFileCheck, FacilityIconFileProblem, FacilityIconFormat, FacilityTypeNameProblem, ICON_EXTENSION, ICON_MIME, ENTRIES (+16 more)

### Community 117 - "Community 117"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 118 - "Community 118"
Cohesion: 0.11
Nodes (25): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, AnalyticsContext, analyticsCsv() (+17 more)

### Community 119 - "Community 119"
Cohesion: 0.14
Nodes (25): addYear(), EVENT_LIMITS, EVENT_PHASE_LABELS, EVENT_REPEATS, EVENT_SOON_DAYS, EVENT_STATUS_LABELS, EVENT_STATUSES, EventInputErrors (+17 more)

### Community 120 - "Community 120"
Cohesion: 0.15
Nodes (25): checkPolygon(), isClosedRing(), Box, boxesOverlap(), boxOf(), clipConvex(), cross(), distanceToRing() (+17 more)

### Community 121 - "Community 121"
Cohesion: 0.20
Nodes (16): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf() (+8 more)

### Community 122 - "Community 122"
Cohesion: 0.15
Nodes (19): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+11 more)

### Community 123 - "Community 123"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 124 - "Community 124"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 125 - "Community 125"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 126 - "Community 126"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 127 - "Community 127"
Cohesion: 0.12
Nodes (21): confidenceLevel(), isPositive(), pixelToLngLat(), PlanCorners, readObject(), readScanResult(), roomGeometry(), SCAN_CONFIDENCE_LABELS (+13 more)

### Community 128 - "Community 128"
Cohesion: 0.16
Nodes (23): SnapshotNavEdge, at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph() (+15 more)

### Community 129 - "Community 129"
Cohesion: 0.14
Nodes (20): BASEMAP_MESSAGES, SystemFormErrors, SystemFormValues, SystemTextField, base, URL_MESSAGES, validate(), checkBasemapTileUrl() (+12 more)

### Community 130 - "Community 130"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 131 - "Community 131"
Cohesion: 0.09
Nodes (23): zod@catalog:, ClosureId, ClosureIdSchema, ConnectorId, ConnectorIdSchema, FacilityTypeIdSchema, FloorPlanIdSchema, InfoPointId (+15 more)

### Community 132 - "Community 132"
Cohesion: 0.25
Nodes (21): closestBetween(), along(), anchored(), cross(), crossing(), distance(), EMPTY_PATCH, GraphChange (+13 more)

### Community 133 - "Community 133"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 134 - "Community 134"
Cohesion: 0.09
Nodes (24): @indoor/data@workspace:*, pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog: (+16 more)

### Community 135 - "Community 135"
Cohesion: 0.09
Nodes (24): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, @indoor/routing@workspace:*, @axe-core/playwright, devDependencies, @axe-core/playwright@catalog:, @biomejs/biome@catalog: (+16 more)

### Community 136 - "Community 136"
Cohesion: 0.09
Nodes (24): @biomejs/biome, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+16 more)

### Community 137 - "Community 137"
Cohesion: 0.16
Nodes (17): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), useSnapshot(), Prefetch, PrefetchHolder (+9 more)

### Community 138 - "Community 138"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 139 - "Community 139"
Cohesion: 0.14
Nodes (23): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode, GeometryValidationOptions (+15 more)

### Community 140 - "Community 140"
Cohesion: 0.15
Nodes (15): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+7 more)

### Community 141 - "Community 141"
Cohesion: 0.13
Nodes (18): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), checkCustomField(), CustomField, CustomFieldProblem, customFieldsSchema() (+10 more)

### Community 142 - "Community 142"
Cohesion: 0.18
Nodes (18): AddStop(), targetOfHit(), routeFailure(), routeFloors(), targetOfPlace(), tripSegments(), ClosureNotice(), Destinations() (+10 more)

### Community 143 - "Community 143"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 144 - "Community 144"
Cohesion: 0.15
Nodes (20): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+12 more)

### Community 145 - "Community 145"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 146 - "Community 146"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 147 - "Community 147"
Cohesion: 0.13
Nodes (20): expected(), expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue(), Db (+12 more)

### Community 148 - "Community 148"
Cohesion: 0.10
Nodes (21): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog:, vitest@catalog: (+13 more)

### Community 149 - "Community 149"
Cohesion: 0.13
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.mfa_required_roles(), system_settings_guard_mfa, analytics_events_time, analytics_events_venue_time (+7 more)

### Community 150 - "Community 150"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 151 - "Community 151"
Cohesion: 0.15
Nodes (18): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+10 more)

### Community 152 - "Community 152"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 153 - "Community 153"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 154 - "Community 154"
Cohesion: 0.14
Nodes (14): floors, gu, options, radiology, square, toilet, venueId, facilityTypesKey() (+6 more)

### Community 155 - "Community 155"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 156 - "Community 156"
Cohesion: 0.13
Nodes (16): Demo(), DemoBoundary, DemoMap, DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.11
Nodes (14): repoRoot, settled(), sheet(), build, built, { chromium }, encoded, frameFile (+6 more)

### Community 158 - "Community 158"
Cohesion: 0.13
Nodes (11): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.acquire_edit_lock() (+3 more)

### Community 159 - "Community 159"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 160 - "Community 160"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 161 - "Community 161"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 162 - "Community 162"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 163 - "Community 163"
Cohesion: 0.15
Nodes (11): FieldRow, LocationTypesRepository, mapFieldRow(), mapLocationTypeRow(), toFieldRow(), TypeRow, field, LocationTypeInput (+3 more)

### Community 164 - "Community 164"
Cohesion: 0.11
Nodes (15): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+7 more)

### Community 165 - "Community 165"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 166 - "Community 166"
Cohesion: 0.16
Nodes (12): polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineStringSchema, MultiPolygon, MultiPolygonSchema, PointSchema (+4 more)

### Community 167 - "Community 167"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 168 - "Community 168"
Cohesion: 0.14
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 169 - "Community 169"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 170 - "Community 170"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 171 - "Community 171"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 172 - "Community 172"
Cohesion: 0.13
Nodes (16): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, vitest (+8 more)

### Community 173 - "Community 173"
Cohesion: 0.19
Nodes (12): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+4 more)

### Community 174 - "Community 174"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 175 - "Community 175"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 176 - "Community 176"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 177 - "Community 177"
Cohesion: 0.12
Nodes (9): OriginPointDraft, Candidate, EntranceSuggestion, Position, originPointUrl(), OriginSnap, BASE, corridor (+1 more)

### Community 178 - "Community 178"
Cohesion: 0.28
Nodes (13): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+5 more)

### Community 179 - "Community 179"
Cohesion: 0.32
Nodes (12): home(), LanguageSwitch(), MobileMenu(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+4 more)

### Community 180 - "Community 180"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 181 - "Community 181"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 182 - "Community 182"
Cohesion: 0.27
Nodes (12): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+4 more)

### Community 183 - "Community 183"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 184 - "Community 184"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 185 - "Community 185"
Cohesion: 0.24
Nodes (8): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NOTIFICATION_KINDS, NotificationKind, NotificationPreferences, RECIPIENT_ROLES, withDefaultPreferences()

### Community 186 - "Community 186"
Cohesion: 0.29
Nodes (10): areaM2(), Cell, cell(), CellQueue, centroidCell(), labelPoint(), segmentDistanceSq(), signedDistance() (+2 more)

### Community 187 - "Community 187"
Cohesion: 0.24
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 188 - "Community 188"
Cohesion: 0.24
Nodes (10): SearchField(), useDebouncedValue(), openHit(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit() (+2 more)

### Community 189 - "Community 189"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 190 - "Community 190"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 191 - "Community 191"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 192 - "Community 192"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 193 - "Community 193"
Cohesion: 0.23
Nodes (6): CategoriesRepository, FacilityIcon, CategoryId, Category, CategoryInput, LocationTypeSummary

### Community 194 - "Community 194"
Cohesion: 0.22
Nodes (11): ellipse(), here, lines, lucideRoot, num(), points(), rect(), require (+3 more)

### Community 195 - "Community 195"
Cohesion: 0.23
Nodes (10): A4, analyticsPdf(), fixed(), Line, lines(), pages(), ANALYTICS_KIND_LABELS, ANALYTICS_KINDS (+2 more)

### Community 196 - "Community 196"
Cohesion: 0.17
Nodes (12): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vite-plugin-pwa@catalog:, vitest@catalog:, workbox-window@catalog: (+4 more)

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
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 201 - "Community 201"
Cohesion: 0.18
Nodes (8): admin(), anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

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
Cohesion: 0.24
Nodes (9): BASE, corridor, EMPTY, FEATURES, m(), near(), point(), unit() (+1 more)

### Community 206 - "Community 206"
Cohesion: 0.24
Nodes (7): Fixtures, base(), playlist(), PNG, setUp(), slide(), FullVenue

### Community 207 - "Community 207"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 208 - "Community 208"
Cohesion: 0.27
Nodes (9): Db, DEMO_USERS, demoClosures(), demoEmail(), DemoUser, hoursFromNow(), RELEASE_NOTES, seedDemoUsers() (+1 more)

### Community 209 - "Community 209"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 210 - "Community 210"
Cohesion: 0.29
Nodes (8): areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers(), ClosureMarks, setClosureMarks()

### Community 211 - "Community 211"
Cohesion: 0.20
Nodes (7): { chromium }, EMBLEMS, font, LOGOS, out, require, root

### Community 212 - "Community 212"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 213 - "Community 213"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 214 - "Community 214"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 215 - "Community 215"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 216 - "Community 216"
Cohesion: 0.22
Nodes (5): ValidatedFeature, boundary, features, FixtureFeature, issues

### Community 217 - "Community 217"
Cohesion: 0.32
Nodes (5): submit(), BuildingInput, BuildingInputProblem, checkBuildingInput(), normalizeBuildingCode()

### Community 218 - "Community 218"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 219 - "Community 219"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 220 - "Community 220"
Cohesion: 0.39
Nodes (6): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota

### Community 221 - "Community 221"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

### Community 223 - "Community 223"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 224 - "Community 224"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.43
Nodes (6): clock(), DAY_KEYS, OpenStatus(), useMinute(), weekdayIn(), OpenState

### Community 226 - "Community 226"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 228 - "Community 228"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 229 - "Community 229"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 230 - "Community 230"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 231 - "Community 231"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 232 - "Community 232"
Cohesion: 0.38
Nodes (4): LIBRARY_SHAPES, LUCIDE_VERSION, LEGACY_SHAPES, PictogramPart

### Community 233 - "Community 233"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 234 - "Community 234"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 235 - "Community 235"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 236 - "Community 236"
Cohesion: 0.47
Nodes (5): domainGraph(), filesIn(), functionsDir, root, specifiers()

### Community 237 - "Community 237"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 238 - "Community 238"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 239 - "Community 239"
Cohesion: 0.53
Nodes (4): detectWebGL(), supportsWebGL(), WebGLProbeCanvas, canvas()

### Community 240 - "Community 240"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 241 - "Community 241"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 242 - "Community 242"
Cohesion: 0.33
Nodes (5): [command, ...args], env, result, root, supabase

### Community 243 - "Community 243"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 244 - "Community 244"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 245 - "Community 245"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 246 - "Community 246"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 248 - "Community 248"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 249 - "Community 249"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 250 - "Community 250"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 251 - "Community 251"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 252 - "Community 252"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

## Knowledge Gaps
- **5 isolated node(s):** `TARGETS`, `RFC-6238`, `RFC-2045`, `RFC-2387`, `RFC-4180`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2738 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **87 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Community 7` to `Community 2`, `Community 4`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 142`, `Community 144`, `Community 17`, `Community 146`, `Community 23`, `Community 24`, `Community 151`, `Community 25`, `Community 156`, `Community 29`, `Community 30`, `Community 32`, `Community 38`, `Community 39`, `Community 43`, `Community 45`, `Community 47`, `Community 49`, `Community 179`, `Community 57`, `Community 61`, `Community 66`, `Community 69`, `Community 90`, `Community 222`, `Community 99`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `TARGETS`, `RFC-6238`, `RFC-2045` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.031211750305997554 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Community 57` to `Community 32`, `Community 225`, `Community 35`, `Community 103`, `Community 7`, `Community 9`, `Community 10`, `Community 45`, `Community 142`, `Community 47`, `Community 18`, `Community 188`, `Community 182`, `Community 92`, `Community 61`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.033891964686518034 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 46` to `Community 0`, `Community 1`, `Community 2`, `Community 131`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 137`, `Community 10`, `Community 11`, `Community 9`, `Community 13`, `Community 14`, `Community 144`, `Community 17`, `Community 147`, `Community 21`, `Community 151`, `Community 24`, `Community 154`, `Community 29`, `Community 31`, `Community 32`, `Community 163`, `Community 36`, `Community 38`, `Community 39`, `Community 42`, `Community 43`, `Community 45`, `Community 47`, `Community 177`, `Community 52`, `Community 58`, `Community 61`, `Community 193`, `Community 66`, `Community 67`, `Community 68`, `Community 75`, `Community 76`, `Community 208`, `Community 89`, `Community 217`, `Community 91`, `Community 93`, `Community 96`, `Community 106`, `Community 112`, `Community 116`, `Community 118`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03885040999920388 - nodes in this community are weakly interconnected._