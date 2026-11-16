# Graph Report - indoor-map  (2026-11-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 9438 nodes · 30178 edges · 332 communities (243 shown, 89 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 483 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5a377d5`
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
- Community 248
- Community 249
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
- Community 267
- Community 270
- Community 271
- Community 272
- Community 273
- Community 274
- Community 275
- Community 276
- Community 280

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
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `OriginPointDraft` --references--> `Position`  [EXTRACTED]
  apps/admin/src/features/origin-points/queries.ts → packages/domain/src/geometry.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `chooseImage()` --calls--> `checkImageFile()`  [EXTRACTED]
  apps/admin/src/features/events/event-dialog.tsx → packages/domain/src/image.ts

## Import Cycles
- None detected.

## Communities (332 total, 89 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (153): Field(), FormNotice(), ForgotPasswordPage(), ClosureForm(), NO_CLOSURES, floorLabel(), fromVenueInput(), impactText() (+145 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (118): RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+110 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (112): createAuthRepository(), signOut(), DataClientConfig, CODE_RULES, CodeRule, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES (+104 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (38): FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, unitSquare(), AdminShell, EditorPage, EditorTool (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (118): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), BrandGallery(), COLUMNS (+110 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (104): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), CategoriesRepository, CategoryRow, createLocationTypesRepository(), FieldRow (+96 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (121): at(), gzipBytes(), largeVenue(), ring(), InsertedVenue, byId(), LocationPlace, Place (+113 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (105): submit(), distanceM(), SnapshotConnectorKind, SnapshotPosition, aStar(), Goal, MinHeap, SearchOptions (+97 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (106): COLUMNS, dateFormat, FILTERS, FloorPlanHistory(), PlanTable(), columns, dateTime, LicenseHistory() (+98 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (42): env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY (+34 more)

### Community 10 - "Community 10"
Cohesion: 0.03
Nodes (42): VenueSelection, Attempt, DataClient, AliasesRepository, AnalyticsRepository, BuildingsRepository, ConnectorsRepository, dayStart() (+34 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (66): SnapshotPolygon, CONTEXT, VENUES, AIRLINES, airportVenue(), FOOD, RETAIL, BuildingSpec (+58 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (87): others, TimezoneSelect(), VenuePicker(), AREA_KINDS, targetKey(), TargetPicker(), FloorFields(), FloorSelect() (+79 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (73): AccountMenu(), FeatureItem(), ItemBody(), ModuleItem(), NavItem(), Sidebar(), SidebarState, useSidebar (+65 more)

### Community 14 - "Community 14"
Cohesion: 0.05
Nodes (81): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, AuthLayout() (+73 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (69): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), ClosureMenu, CONTROL_LABELS, EditorCanvas(), FALLBACK_CENTER, toCollection() (+61 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (81): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+73 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (79): currentGraph(), GraphActions, useGraphActions(), addEntrance(), attachAt(), clamp01(), closestBetween(), firstPosition() (+71 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (85): ACTION_LABELS, ImportDialog(), PLAN_COLUMNS, RESULT_FILTER, Summary(), CustomFieldInputs(), DAYS, DEFAULT_SPAN (+77 more)

### Community 19 - "Community 19"
Cohesion: 0.04
Nodes (76): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT, DEFAULT_FILL, DEFAULT_HEIGHTS (+68 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (67): PlanBackground, ScanPreviewLayer(), ScanConfidenceLevel, DEFAULT_OUTLINE, EDIT_COLORS, PolygonDrawer, Corners, areaFilter() (+59 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (84): loadCrowd(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd() (+76 more)

### Community 22 - "Community 22"
Cohesion: 0.04
Nodes (65): ClosurePlaces, ConnectorDialogState, FormPlace, BUILDINGS, FLOORS, g, venueId, capitalize() (+57 more)

### Community 23 - "Community 23"
Cohesion: 0.04
Nodes (61): NON_RETRYABLE, queryClient, submit(), Tables, DataError, geometryFromColumn(), geometryToColumn(), nullableGeometryFromColumn() (+53 more)

### Community 24 - "Community 24"
Cohesion: 0.03
Nodes (59): page, diagnoseWriteRejection(), sql(), json(), read(), results, root, DESKTOP (+51 more)

### Community 25 - "Community 25"
Cohesion: 0.05
Nodes (70): AppLayout(), NarrowScreenNotice(), subscribe(), Banner(), CheckinNotice(), date, LicenseNotice(), ValidityNotice() (+62 more)

### Community 26 - "Community 26"
Cohesion: 0.05
Nodes (68): exportMap(), save(), slug(), download(), boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf() (+60 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (60): PanelMessage(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell() (+52 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (62): ConnectorPanel(), EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest() (+54 more)

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (61): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), LocationStatus(), locationKindText(), locationSubtitle() (+53 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (34): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+26 more)

### Community 31 - "Community 31"
Cohesion: 0.05
Nodes (65): checkGlb(), checkModelPlacement(), GLB_MIME, GLB_PROBLEM_MESSAGES, GlbProblem, inRange(), latin1(), LibraryModel (+57 more)

### Community 32 - "Community 32"
Cohesion: 0.06
Nodes (54): GraphLayer(), GraphStatus, graphViews(), neighbourPositions(), NO_STATUS, EMPTY, StepFocus, LngLat (+46 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (14): VisitorPage, createVariedVenues(), specs(), shot(), visitorSearch(), shot(), visitorLabel(), TILE_PNG (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.08
Nodes (54): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+46 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (53): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+45 more)

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (49): TestRouteState, DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf() (+41 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (60): failed(), keys, signedLicense(), paidLicense(), canonicalize(), isCount(), isDate(), LicenseIssueRequest (+52 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (54): Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal(), FALLBACK_CENTER (+46 more)

### Community 39 - "Community 39"
Cohesion: 0.04
Nodes (52): connector(), connectors, edge(), edges, ENTRANCES, escalatorDown, escalatorUp, FLOORS (+44 more)

### Community 40 - "Community 40"
Cohesion: 0.07
Nodes (54): inVenueTime(), ClosureDialog(), useClosureDialog, Closures(), FILTERS, isState(), STATES, STATUS (+46 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (48): ColorField(), isColorValue(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FacilityIconPreview(), FacilityTypeDialog() (+40 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 43 - "Community 43"
Cohesion: 0.07
Nodes (34): ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+26 more)

### Community 44 - "Community 44"
Cohesion: 0.08
Nodes (47): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+39 more)

### Community 45 - "Community 45"
Cohesion: 0.05
Nodes (43): highlightBounds(), facility, index, snapshot, DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter() (+35 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (21): DataTablePage, appServers, args, CI, projectArgs, drawPlan(), multiPagePdf(), openGallery() (+13 more)

### Community 47 - "Community 47"
Cohesion: 0.06
Nodes (45): featurePosition(), ShareButton(), ShareResult, useShareUrl(), endPlace(), endTarget(), featureAt(), placeEnd() (+37 more)

### Community 48 - "Community 48"
Cohesion: 0.05
Nodes (45): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+37 more)

### Community 49 - "Community 49"
Cohesion: 0.07
Nodes (43): i18next@catalog:, useVisitorTour(), PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, AnalyticsQueue, choice (+35 more)

### Community 50 - "Community 50"
Cohesion: 0.05
Nodes (35): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.hook_password_verification_attempt() (+27 more)

### Community 51 - "Community 51"
Cohesion: 0.05
Nodes (52): pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog:, @playwright/test@catalog: (+44 more)

### Community 52 - "Community 52"
Cohesion: 0.10
Nodes (44): licenseFileName(), newLicenseId(), onPremTrialIssueRequest(), trialApprovalDaysProblem(), InviteInput, inviteScope(), Role, ROLES (+36 more)

### Community 53 - "Community 53"
Cohesion: 0.14
Nodes (46): ContrastTable(), readToken(), BackupHistory(), formatDate(), formatDateTime(), History(), ClientsTable(), InstallationsTable() (+38 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (48): stringList(), toLicenseKey(), addDays(), addYear(), dayStart(), fail(), isCount(), isoSeconds() (+40 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (40): createCategoriesRepository(), removeFile(), saveError(), uploadIcon(), isUpload(), mapCategoryRow(), checkIconPng(), createFacilityTypesRepository() (+32 more)

### Community 56 - "Community 56"
Cohesion: 0.07
Nodes (28): public.hosting_queue_next(), hosting.vendor_actions, vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create() (+20 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (39): choose(), createForUnit(), editorQueues(), graphSaveQueue(), pickFacilityTypeId(), PropertiesPatch, saveQueue(), SHAPE_OF (+31 more)

### Community 58 - "Community 58"
Cohesion: 0.07
Nodes (37): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+29 more)

### Community 59 - "Community 59"
Cohesion: 0.05
Nodes (48): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog: (+40 more)

### Community 60 - "Community 60"
Cohesion: 0.08
Nodes (42): crowdAreas(), floorCollection(), iconSpecs(), cache, DemoMap(), DemoVenue, snapshotOf(), SNAPSHOTS (+34 more)

### Community 61 - "Community 61"
Cohesion: 0.08
Nodes (37): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), hasBlockingFindings() (+29 more)

### Community 62 - "Community 62"
Cohesion: 0.06
Nodes (22): unit(), SheetSnap, targetOfPick(), useExploreMap(), createExploreStore(), ExploreState, FocusMode, INITIAL (+14 more)

### Community 63 - "Community 63"
Cohesion: 0.07
Nodes (29): haversineM(), SnapshotGraph, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft, ConnectorArcs, nodeDistanceM(), connectorAllows() (+21 more)

### Community 64 - "Community 64"
Cohesion: 0.08
Nodes (20): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+12 more)

### Community 65 - "Community 65"
Cohesion: 0.05
Nodes (45): @types/react-dom, @types/react-dom@catalog:, @types/react-dom@catalog:, @types/react-dom@catalog:, dependencies, class-variance-authority@catalog:, clsx@catalog:, driver.js@catalog: (+37 more)

### Community 66 - "Community 66"
Cohesion: 0.07
Nodes (31): LanguagePicker(), FieldValue(), LocationProfile(), Places(), formatDate(), clock(), DAY_KEYS, OpenStatus() (+23 more)

### Community 67 - "Community 67"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 68 - "Community 68"
Cohesion: 0.08
Nodes (29): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.facility_types, public.field_definitions, public.location_categories (+21 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (25): app.can_access_floor(), app.can_access_location(), app.can_access_location_type(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids() (+17 more)

### Community 70 - "Community 70"
Cohesion: 0.12
Nodes (35): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+27 more)

### Community 71 - "Community 71"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 72 - "Community 72"
Cohesion: 0.10
Nodes (35): RouteGraphStatus, ExploreContext, ExploreData, ExploreProvider(), loadSearch(), NO_STOPS, getCachedSearchIndex(), openDB() (+27 more)

### Community 73 - "Community 73"
Cohesion: 0.08
Nodes (24): areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineStringSchema, MultiPolygonSchema, PointSchema (+16 more)

### Community 74 - "Community 74"
Cohesion: 0.09
Nodes (31): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+23 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 76 - "Community 76"
Cohesion: 0.11
Nodes (31): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+23 more)

### Community 77 - "Community 77"
Cohesion: 0.08
Nodes (33): BUILDING_SIZES, BUILDING_TYPES, CSV_LABELS, date, dateTime, REJECT_REASONS, STAGES, filter() (+25 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 79 - "Community 79"
Cohesion: 0.11
Nodes (19): createFullVenue(), Db, hoursRows(), insert(), insertVenue(), point(), Row, signedInDb() (+11 more)

### Community 80 - "Community 80"
Cohesion: 0.08
Nodes (25): Json, Page, PageQuery, ActorRow, asRecord(), AuditFilters, AuditRepository, AuditRow (+17 more)

### Community 81 - "Community 81"
Cohesion: 0.06
Nodes (37): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @types/node@catalog:, @types/react@catalog:, @types/react-dom@catalog:, typescript@catalog: (+29 more)

### Community 82 - "Community 82"
Cohesion: 0.13
Nodes (29): flushEditor(), useClosurePage(), connectorsKey(), syncStop(), useConnectorMutations(), useConnectors(), CLOSURE_REFRESH_MS, closuresKey() (+21 more)

### Community 83 - "Community 83"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 84 - "Community 84"
Cohesion: 0.09
Nodes (32): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+24 more)

### Community 85 - "Community 85"
Cohesion: 0.08
Nodes (24): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+16 more)

### Community 86 - "Community 86"
Cohesion: 0.06
Nodes (36): @tailwindcss/vite@catalog:, @vitejs/plugin-react@catalog:, @tailwindcss/vite, @vitejs/plugin-react, @tailwindcss/vite@catalog:, @vitejs/plugin-react@catalog:, @tailwindcss/vite@catalog:, @vitejs/plugin-react@catalog: (+28 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 88 - "Community 88"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 89 - "Community 89"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 90 - "Community 90"
Cohesion: 0.12
Nodes (27): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+19 more)

### Community 91 - "Community 91"
Cohesion: 0.07
Nodes (34): @biomejs/biome, typescript, dependencies, zod@catalog:, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog: (+26 more)

### Community 92 - "Community 92"
Cohesion: 0.08
Nodes (22): hosting.trials, hosting.blocklist, hosting.capacity(), hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify() (+14 more)

### Community 93 - "Community 93"
Cohesion: 0.10
Nodes (29): privacyPage(), requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems (+21 more)

### Community 94 - "Community 94"
Cohesion: 0.09
Nodes (17): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+9 more)

### Community 95 - "Community 95"
Cohesion: 0.12
Nodes (27): Editor(), footprintCenter(), useActivePlan(), useFloorSelection(), useStepFloor(), LockBanner(), time, ACTIVITY_EVENTS (+19 more)

### Community 96 - "Community 96"
Cohesion: 0.12
Nodes (28): toBrandingFormValues(), BrandingPreview(), CHIPS, Mark(), RouteSketch(), BrandingForm(), submit(), BrandingPanel() (+20 more)

### Community 97 - "Community 97"
Cohesion: 0.11
Nodes (27): SnapshotNavNode, Network, at(), FLOORS, graphOf(), at(), CATEGORY_ID, DENSE_FLOOR (+19 more)

### Community 98 - "Community 98"
Cohesion: 0.11
Nodes (26): geometryOf(), RouteLayer(), FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), prefersReducedMotion(), appliedColors (+18 more)

### Community 99 - "Community 99"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 100 - "Community 100"
Cohesion: 0.07
Nodes (32): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+24 more)

### Community 101 - "Community 101"
Cohesion: 0.07
Nodes (31): @tanstack/react-query@catalog:, @tanstack/react-query, dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:*, @indoor/ui@workspace:*, react@catalog:, react-dom@catalog: (+23 more)

### Community 102 - "Community 102"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 103 - "Community 103"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 104 - "Community 104"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 105 - "Community 105"
Cohesion: 0.13
Nodes (28): TRIAL_FEATURES, TRIAL_MIN_DAYS, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal(), OnPremTrialRequest (+20 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (18): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), app.block_publish_over_quota(), app.sync_service_trigger() (+10 more)

### Community 107 - "Community 107"
Cohesion: 0.12
Nodes (26): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toPatch(), validate(), submit() (+18 more)

### Community 108 - "Community 108"
Cohesion: 0.12
Nodes (23): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+15 more)

### Community 109 - "Community 109"
Cohesion: 0.09
Nodes (21): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+13 more)

### Community 110 - "Community 110"
Cohesion: 0.12
Nodes (26): submit(), changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formDraft(), formFloorIds(), initialForm() (+18 more)

### Community 111 - "Community 111"
Cohesion: 0.18
Nodes (20): VenueSpec, fieldKeyFromLabel(), airportStation, campus, custom, factoryWarehouse, hospital, hours (+12 more)

### Community 112 - "Community 112"
Cohesion: 0.16
Nodes (26): roomGeometry(), Box, boxesOverlap(), boxOf(), clipConvex(), cross(), distanceToRing(), distanceToSegment() (+18 more)

### Community 113 - "Community 113"
Cohesion: 0.20
Nodes (24): data, EventDetail(), EventList(), EventRow(), KindBadge(), LiveBadge(), LocationEvents(), Section() (+16 more)

### Community 114 - "Community 114"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 115 - "Community 115"
Cohesion: 0.09
Nodes (18): createAnalyticsRepository(), CadConverterRepository, CadLayer, CadRender, createCadConverterRepository(), post(), DXF, Messages (+10 more)

### Community 116 - "Community 116"
Cohesion: 0.13
Nodes (25): addYear(), EVENT_LIMITS, EVENT_PHASE_LABELS, EVENT_REPEATS, EVENT_SOON_DAYS, EVENT_STATUS_LABELS, EVENT_STATUSES, EventInputErrors (+17 more)

### Community 117 - "Community 117"
Cohesion: 0.11
Nodes (21): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+13 more)

### Community 118 - "Community 118"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 119 - "Community 119"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 120 - "Community 120"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 121 - "Community 121"
Cohesion: 0.11
Nodes (25): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, AnalyticsContext, analyticsCsv() (+17 more)

### Community 122 - "Community 122"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 123 - "Community 123"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 124 - "Community 124"
Cohesion: 0.14
Nodes (21): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+13 more)

### Community 125 - "Community 125"
Cohesion: 0.16
Nodes (20): choose(), downloadCsvTemplate(), downloadXlsxTemplate(), readTable(), save(), slug(), columnIndex(), columnName() (+12 more)

### Community 126 - "Community 126"
Cohesion: 0.17
Nodes (19): colorNotes(), channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI (+11 more)

### Community 127 - "Community 127"
Cohesion: 0.13
Nodes (19): confidenceLevel(), isPositive(), pixelToLngLat(), PlanCorners, readObject(), readScanResult(), SCAN_CONFIDENCE_LABELS, SCAN_MIN_ROOM_M2 (+11 more)

### Community 128 - "Community 128"
Cohesion: 0.15
Nodes (24): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+16 more)

### Community 129 - "Community 129"
Cohesion: 0.15
Nodes (20): BrandingFormErrors, BrandingFormValues, ColorNote, livePreview(), MESSAGES, ratio, empty, validateBranding() (+12 more)

### Community 130 - "Community 130"
Cohesion: 0.13
Nodes (22): expected(), LocationPageFilters, expected(), newDb(), NO_FILTERS, signIn(), CategoryKey, createLargeVenue() (+14 more)

### Community 131 - "Community 131"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 132 - "Community 132"
Cohesion: 0.15
Nodes (13): InstructionErrors, SAMPLE, SAMPLE_FLOOR, validateInstruction(), DEFAULT_INSTRUCTION_TEMPLATES, INSTRUCTION_ACTION_LABELS, INSTRUCTION_ACTIONS, InstructionAction (+5 more)

### Community 133 - "Community 133"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 134 - "Community 134"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, exports, ./testing/full-venue, ./testing/large-venue (+14 more)

### Community 135 - "Community 135"
Cohesion: 0.10
Nodes (22): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog:, vitest@catalog: (+14 more)

### Community 136 - "Community 136"
Cohesion: 0.15
Nodes (20): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+12 more)

### Community 137 - "Community 137"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 138 - "Community 138"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 139 - "Community 139"
Cohesion: 0.12
Nodes (15): PublishedVenue, TestVenue, globalSetup(), RoleTargets, SERVER_ATTEMPTS, SQUARE, ROLES, signedIn() (+7 more)

### Community 140 - "Community 140"
Cohesion: 0.13
Nodes (14): createFloorPlansRepository(), put(), venueOf(), FloorPlanRow, FloorPlansRepository, FloorPlanUpload, isCorners(), mapFloorPlanRow() (+6 more)

### Community 141 - "Community 141"
Cohesion: 0.13
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.mfa_required_roles(), system_settings_guard_mfa, analytics_events_time, analytics_events_venue_time (+7 more)

### Community 142 - "Community 142"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 143 - "Community 143"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 144 - "Community 144"
Cohesion: 0.22
Nodes (19): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), modelOf(), num() (+11 more)

### Community 145 - "Community 145"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 146 - "Community 146"
Cohesion: 0.16
Nodes (18): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+10 more)

### Community 147 - "Community 147"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (19): @types/node, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports (+11 more)

### Community 149 - "Community 149"
Cohesion: 0.13
Nodes (11): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.acquire_edit_lock() (+3 more)

### Community 150 - "Community 150"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 151 - "Community 151"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 152 - "Community 152"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.26
Nodes (15): home(), LanguageSwitch(), MobileMenu(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+7 more)

### Community 154 - "Community 154"
Cohesion: 0.16
Nodes (14): failed(), keys, checkCheckinRequest(), CheckinCheck, CheckinRequest, checkNewRelease(), InstallationReleaseState, installationReleaseState() (+6 more)

### Community 155 - "Community 155"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 156 - "Community 156"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 157 - "Community 157"
Cohesion: 0.14
Nodes (15): ENTRIES, Entry, HAYSTACKS, info(), KEY_SET, PICTOGRAM_CATEGORIES, PICTOGRAM_CATEGORY_LABELS, PICTOGRAM_KEYS (+7 more)

### Community 158 - "Community 158"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 159 - "Community 159"
Cohesion: 0.11
Nodes (18): bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest (+10 more)

### Community 160 - "Community 160"
Cohesion: 0.12
Nodes (3): EditorState, Direction, EditorTool

### Community 161 - "Community 161"
Cohesion: 0.13
Nodes (9): EventSave, Fixtures, base(), playlist(), PNG, setUp(), slide(), FullVenue (+1 more)

### Community 162 - "Community 162"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 163 - "Community 163"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 164 - "Community 164"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 165 - "Community 165"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 166 - "Community 166"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 167 - "Community 167"
Cohesion: 0.12
Nodes (16): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, vitest, license, name (+8 more)

### Community 168 - "Community 168"
Cohesion: 0.28
Nodes (13): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+5 more)

### Community 169 - "Community 169"
Cohesion: 0.15
Nodes (12): Demo(), DemoBoundary, DemoMap, DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult (+4 more)

### Community 170 - "Community 170"
Cohesion: 0.21
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 171 - "Community 171"
Cohesion: 0.20
Nodes (11): PictogramKey, TemplateCategory, TemplateFacilityType, TemplateLocationType, LIBRARY_SHAPES, LUCIDE_VERSION, partAttributes(), Pictogram() (+3 more)

### Community 172 - "Community 172"
Cohesion: 0.17
Nodes (11): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+3 more)

### Community 173 - "Community 173"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 174 - "Community 174"
Cohesion: 0.23
Nodes (9): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NOTIFICATION_KINDS, NotificationKind, notificationKindsFor(), NotificationPreferences, RECIPIENT_ROLES (+1 more)

### Community 175 - "Community 175"
Cohesion: 0.25
Nodes (14): DEV_KEY, newDb(), signIn(), admin(), createVendorStub(), activate(), checkin(), renew() (+6 more)

### Community 176 - "Community 176"
Cohesion: 0.19
Nodes (11): Db, DEMO_USERS, demoClosures(), demoEmail(), DemoUser, hoursFromNow(), RELEASE_NOTES, seedDemoUsers() (+3 more)

### Community 177 - "Community 177"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), mixdown() (+6 more)

### Community 178 - "Community 178"
Cohesion: 0.22
Nodes (10): ClosureMarkData, closureMarks(), knownClosures(), base, closure(), snapshot, useClosureMap(), CLOSURE_REFRESH_MS (+2 more)

### Community 180 - "Community 180"
Cohesion: 0.20
Nodes (11): ellipse(), here, lines, lucideRoot, num(), points(), rect(), require (+3 more)

### Community 181 - "Community 181"
Cohesion: 0.24
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 182 - "Community 182"
Cohesion: 0.18
Nodes (6): EMPTY, ScanState, LineString, ScanCandidate, ScanCandidates, ScanPreview

### Community 183 - "Community 183"
Cohesion: 0.18
Nodes (6): rootElement, router, NON_RETRYABLE, queryClient, rootElement, router

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

### Community 188 - "Community 188"
Cohesion: 0.19
Nodes (12): functionError(), Functions, LicenseRow, NewVendorClient, NewVendorInstallation, readLicenseFile(), toLicense(), toTrialRequest() (+4 more)

### Community 189 - "Community 189"
Cohesion: 0.22
Nodes (10): hhmm(), isOpenAt(), localParts(), minutes(), openingHoursFromRows(), OpeningHoursProblem, OpeningSpan, shiftDate() (+2 more)

### Community 190 - "Community 190"
Cohesion: 0.15
Nodes (8): connectors, edges, graph, hall, nodes, now, options, square

### Community 191 - "Community 191"
Cohesion: 0.23
Nodes (10): A4, analyticsPdf(), fixed(), Line, lines(), pages(), ANALYTICS_KIND_LABELS, ANALYTICS_KINDS (+2 more)

### Community 192 - "Community 192"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 193 - "Community 193"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 194 - "Community 194"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 195 - "Community 195"
Cohesion: 0.17
Nodes (3): VendorClientsRepository, VendorLicense, VendorTrialRequest

### Community 196 - "Community 196"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 197 - "Community 197"
Cohesion: 0.24
Nodes (8): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target

### Community 198 - "Community 198"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 199 - "Community 199"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 200 - "Community 200"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 202 - "Community 202"
Cohesion: 0.38
Nodes (6): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName(), applyBranding()

### Community 203 - "Community 203"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 204 - "Community 204"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 205 - "Community 205"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 206 - "Community 206"
Cohesion: 0.31
Nodes (8): failed(), finishWithLifecycle(), keys, TrialAction, useBlockActions(), useClients(), useInstallations(), useTrialAction()

### Community 207 - "Community 207"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 208 - "Community 208"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 209 - "Community 209"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 210 - "Community 210"
Cohesion: 0.22
Nodes (9): exports, ./fixtures/*, ./license, ./license-issue, ./license-key, ./license-public-key, ./onprem-trial, ./trial-request (+1 more)

### Community 211 - "Community 211"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 212 - "Community 212"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 213 - "Community 213"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 214 - "Community 214"
Cohesion: 0.29
Nodes (6): EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 215 - "Community 215"
Cohesion: 0.25
Nodes (4): boundary, features, FixtureFeature, issues

### Community 216 - "Community 216"
Cohesion: 0.39
Nodes (6): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota

### Community 217 - "Community 217"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 218 - "Community 218"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 219 - "Community 219"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 220 - "Community 220"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

### Community 221 - "Community 221"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 224 - "Community 224"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 225 - "Community 225"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 226 - "Community 226"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 227 - "Community 227"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 228 - "Community 228"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 229 - "Community 229"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 230 - "Community 230"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 231 - "Community 231"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 232 - "Community 232"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 233 - "Community 233"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

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
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 239 - "Community 239"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 240 - "Community 240"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 241 - "Community 241"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 242 - "Community 242"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 243 - "Community 243"
Cohesion: 0.40
Nodes (5): on, pull_request, push, workflow_dispatch, branches

### Community 244 - "Community 244"
Cohesion: 0.40
Nodes (3): FeatureKindSchema, GeometrySchema, square

### Community 245 - "Community 245"
Cohesion: 0.50
Nodes (3): VENUE_TEMPLATES, VenueTemplateSchema, VENUE_TYPES

## Knowledge Gaps
- **5 isolated node(s):** `RFC-6238`, `RFC-4180`, `TARGETS`, `RFC-2045`, `RFC-2387`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2753 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **89 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `VenueId` connect `Community 10` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 132`, `Community 130`, `Community 136`, `Community 8`, `Community 12`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 22`, `Community 23`, `Community 26`, `Community 27`, `Community 30`, `Community 40`, `Community 41`, `Community 44`, `Community 47`, `Community 176`, `Community 49`, `Community 178`, `Community 55`, `Community 57`, `Community 64`, `Community 72`, `Community 73`, `Community 77`, `Community 206`, `Community 80`, `Community 82`, `Community 94`, `Community 95`, `Community 96`, `Community 107`, `Community 108`, `Community 113`, `Community 115`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `RFC-4180`, `TARGETS` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04879396984924623 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Community 66` to `Community 59`, `Community 44`, `Community 13`, `Community 12`, `Community 47`, `Community 16`, `Community 49`, `Community 113`, `Community 86`, `Community 87`, `Community 27`, `Community 29`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.027028470701351424 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `Community 91` to `Community 65`, `Community 100`, `Community 101`, `Community 134`, `Community 135`, `Community 167`, `Community 81`, `Community 51`, `Community 148`, `Community 86`, `Community 59`, `Community 159`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03206521739130435 - nodes in this community are weakly interconnected._