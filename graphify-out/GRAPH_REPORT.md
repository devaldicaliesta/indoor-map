# Graph Report - indoor-map  (2026-11-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8384 nodes · 26405 edges · 306 communities (231 shown, 75 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 392 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f1cf4bec`
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
- Community 238
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 248
- Community 251
- Community 252
- Community 253
- Community 254
- Community 255
- Community 256
- Community 260

## God Nodes (most connected - your core abstractions)
1. `Button()` - 278 edges
2. `VenueId` - 192 edges
3. `cn()` - 145 edges
4. `Input()` - 116 edges
5. `test` - 108 edges
6. `createRepositories()` - 99 edges
7. `toDataError()` - 94 edges
8. `FormNotice()` - 90 edges
9. `DataError` - 87 edges
10. `Skeleton()` - 81 edges

## Surprising Connections (you probably didn't know these)
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts
- `OriginPointDraft` --references--> `Position`  [EXTRACTED]
  apps/admin/src/features/origin-points/queries.ts → packages/domain/src/geometry.ts

## Import Cycles
- None detected.

## Communities (306 total, 75 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (118): RFC-6238, expected(), createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema (+110 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (143): ColorField(), isColorValue(), Field(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FormNotice() (+135 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (102): EntranceField(), EntranceLayer(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+94 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (103): move(), Tables, CategoriesRepository, CategoryRow, createCategoriesRepository(), removeFile(), saveError(), uploadIcon() (+95 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (84): BrandGallery(), Section(), AccountMenu(), AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar() (+76 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (26): Fixtures, FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, TestVenue, unitSquare(), VisitorPage (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (90): currentProfileKey, useAuthSync(), RequireAuth(), data, initialAuthRedirectHash, useVenueSelection, venuesKey, AuthLayout() (+82 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (104): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+96 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (94): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), HomeRedirect() (+86 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (91): MapLabel, COORDINATE_DECIMALS, DEFAULT_FILL, DEFAULT_HEIGHTS, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, PITCH_3D, POINT_COLOR (+83 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (98): loadCrowd(), SnapshotNodeRole, FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), getCamera(), prefersReducedMotion() (+90 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (91): others, TimezoneSelect(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage(), VenuePicker(), Providers() (+83 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (44): VenueSelection, RouteSources, DataClient, AliasesRepository, ClosuresRepository, ConnectorsRepository, DisplaySettingsRepository, DisplaySettingsRow (+36 more)

### Community 13 - "Community 13"
Cohesion: 0.03
Nodes (64): KIND_ORDER, PlaceKind, PlaceOption, PlaceSources, POINT_NAME, searchPlaces(), floors, gu (+56 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (58): Geometry, EDIT_COLORS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor (+50 more)

### Community 15 - "Community 15"
Cohesion: 0.04
Nodes (48): ACCOUNTS, env, envFile, PublishedVenue, globalSetup(), inviteUser(), Mail, MailpitDetail (+40 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (73): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+65 more)

### Community 17 - "Community 17"
Cohesion: 0.04
Nodes (70): createAuthRepository(), signOut(), Json, isNetworkFailure(), readString(), toDataError(), fromFunctionError(), fetchAllPages() (+62 more)

### Community 18 - "Community 18"
Cohesion: 0.03
Nodes (59): page, diagnoseWriteRejection(), sql(), json(), read(), results, root, DESKTOP (+51 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (77): signedLicense(), paidLicense(), canonicalize(), fromBase64(), importLicensePublicKey(), isCount(), isDate(), isText() (+69 more)

### Community 20 - "Community 20"
Cohesion: 0.04
Nodes (48): TestRouteState, SheetSnap, featureName(), featurePosition(), featureView(), OriginView, originView(), placeOfTarget() (+40 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (65): moveTo(), FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), VenueSpec, zod@catalog:, checkCustomField() (+57 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (71): useFloorSelection(), buildingNames(), floorNames(), IMAGE_MESSAGES, LOCATION_STATUS_LABELS, LOCATION_STATUS_TONE, NAME_MESSAGES, placeText() (+63 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (59): PanelMessage(), useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX (+51 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (63): closureMarks(), useClosureMap(), CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX (+55 more)

### Community 25 - "Community 25"
Cohesion: 0.03
Nodes (75): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react-dom@catalog:, typescript@catalog: (+67 more)

### Community 26 - "Community 26"
Cohesion: 0.04
Nodes (40): DataClientConfig, ActivatedLicense, CheckinResult, FirstAdminInput, LicenseDetails, LicenseHistoryEntry, LicenseRepository, LicenseState (+32 more)

### Community 27 - "Community 27"
Cohesion: 0.10
Nodes (56): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+48 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (20): AdminShell, EditorPage, EditorTool, at(), drawUnit(), ring(), square(), unitsOn() (+12 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (30): createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY, devLicenseFile(), releaseLicense() (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (29): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+21 more)

### Community 31 - "Community 31"
Cohesion: 0.06
Nodes (45): CODE_RULES, CodeRule, DataError, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES, readHttpStatus(), FUNCTION_KINDS (+37 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (49): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+41 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (51): AIRLINES, FOOD, RETAIL, BuildingSpec, BuiltBuilding, BuiltFloor, dailyHours(), FloorSpec (+43 more)

### Community 34 - "Community 34"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (54): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GeometryIssueCode, GeometryValidationOptions (+46 more)

### Community 36 - "Community 36"
Cohesion: 0.07
Nodes (46): GraphLayer(), graphSnapFeatures(), graphViews(), neighbourPositions(), NO_STATUS, createGraphInteractions(), onMove(), onUp() (+38 more)

### Community 37 - "Community 37"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (49): at(), gzipBytes(), largeVenue(), ring(), InsertedVenue, OutdoorSubtype, normalizeSearchText(), buildSearchIndex() (+41 more)

### Community 39 - "Community 39"
Cohesion: 0.07
Nodes (47): RouteGraphStatus, closure(), failure, useMapAvailable(), ExploreContext, ExploreData, ExploreProvider(), loadSearch() (+39 more)

### Community 40 - "Community 40"
Cohesion: 0.05
Nodes (55): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog:, pdfjs-dist@catalog: (+47 more)

### Community 41 - "Community 41"
Cohesion: 0.09
Nodes (44): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, ClosurePlaces, fromVenueInput(), impactText(), offsetMs() (+36 more)

### Community 42 - "Community 42"
Cohesion: 0.06
Nodes (47): Draft, LicenseForm(), QUOTA_FIELDS, QuotaKey, REQUIRED, toDraft(), toInput(), addDays() (+39 more)

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (39): base, snapshot, facility, index, snapshot, index, snapshot, INFO_POINT_ZOOM (+31 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (47): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+39 more)

### Community 45 - "Community 45"
Cohesion: 0.07
Nodes (45): ActivationPage(), EulaChoice, InstanceId(), ManualForm(), OnlineForm(), STATE_NOTICE, TrialForm(), Banner() (+37 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (36): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_code_unique, locations_release_units, public.categories, public.facility_types, public.field_definitions (+28 more)

### Community 47 - "Community 47"
Cohesion: 0.05
Nodes (45): PolygonSchema, PositionSchema, DisplayField, INSTRUCTION_ACTIONS, BuildingSchema, FeatureSchema, FloorSchema, GraphSchema (+37 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (13): CONTEXT, VENUES, airportVenue(), VenueBuilder, campusVenue(), concertVenue(), factoryVenue(), rect() (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (36): ListTab, capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText() (+28 more)

### Community 50 - "Community 50"
Cohesion: 0.09
Nodes (39): FEATURE_KIND_LABELS, CommitInput(), commit(), FacilityFields(), hasHeight(), HeightField(), MESSAGES, number (+31 more)

### Community 51 - "Community 51"
Cohesion: 0.07
Nodes (35): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+27 more)

### Community 52 - "Community 52"
Cohesion: 0.08
Nodes (37): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, EMPTY_SNAPSHOT_GRAPH, snapshotGraphPath(), splitSnapshot(), hasBlockingFindings() (+29 more)

### Community 53 - "Community 53"
Cohesion: 0.10
Nodes (37): HOSTED_TRIAL_DAYS, serviceHeaders, url, VENDOR_EMAIL, newToken(), sha256Hex(), toBase64Url(), button() (+29 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (31): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.hook_password_verification_attempt() (+23 more)

### Community 55 - "Community 55"
Cohesion: 0.10
Nodes (37): inVenueTime(), OUTDOOR, infoPointsKey(), useRemoveInfoPoint(), useSaveInfoPoint(), OriginPointDraft, originPointsKey(), SnapError (+29 more)

### Community 56 - "Community 56"
Cohesion: 0.08
Nodes (27): ConnectorDialogState, areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), Connector, LinearRingSchema, LineString (+19 more)

### Community 57 - "Community 57"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 58 - "Community 58"
Cohesion: 0.06
Nodes (40): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+32 more)

### Community 59 - "Community 59"
Cohesion: 0.08
Nodes (14): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.08
Nodes (23): LoginPage, appServers, args, CI, projectArgs, InvitedUser, contrastOn(), enableAutoTours() (+15 more)

### Community 61 - "Community 61"
Cohesion: 0.07
Nodes (22): CadConverterRepository, CadLayer, CadRender, createCadConverterRepository(), post(), STATUS_KINDS, createEditLocksRepository(), acquire() (+14 more)

### Community 62 - "Community 62"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 64 - "Community 64"
Cohesion: 0.06
Nodes (39): dependencies, class-variance-authority@catalog:, clsx@catalog:, driver.js@catalog:, @indoor/domain@workspace:*, lucide-react@catalog:, radix-ui@catalog:, sonner@catalog: (+31 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 66 - "Community 66"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 67 - "Community 67"
Cohesion: 0.08
Nodes (25): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+17 more)

### Community 68 - "Community 68"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 69 - "Community 69"
Cohesion: 0.11
Nodes (30): ClosedElements, closedElements(), ClosedElementsOptions, featureNodeIds(), polygonsOf(), ClosureImpact, closureImpact(), connectedFloors() (+22 more)

### Community 70 - "Community 70"
Cohesion: 0.06
Nodes (21): app.can_access_floor(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids(), app.all_venues_user(), app.accessible_venue_keys() (+13 more)

### Community 71 - "Community 71"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 72 - "Community 72"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 73 - "Community 73"
Cohesion: 0.09
Nodes (31): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACTION_ROLES, ADMIN_ACTIONS (+23 more)

### Community 74 - "Community 74"
Cohesion: 0.12
Nodes (24): haversineM(), SnapshotFeature, SnapshotFloor, SnapshotGraph, SnapshotInfoPoint, SnapshotOriginPoint, ARC_ACCESSIBLE, ARC_CONNECTOR (+16 more)

### Community 75 - "Community 75"
Cohesion: 0.08
Nodes (22): hosting.trials, hosting.blocklist, hosting.trial_requests, hosting.vendor_staff, public.hosting_request_get(), public.hosting_request_requeue(), public.hosting_request_verify(), trial_requests_domain_idx (+14 more)

### Community 76 - "Community 76"
Cohesion: 0.09
Nodes (29): geometryOf(), RouteLayer(), ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID, originCollection(), originLayers(), OriginMarker (+21 more)

### Community 77 - "Community 77"
Cohesion: 0.09
Nodes (30): privacyPage(), requestTrial(), en, id, TRIAL_COPY, TrialCopy, Field(), Problems (+22 more)

### Community 78 - "Community 78"
Cohesion: 0.11
Nodes (28): RouteFailure, routeFailure(), routeFloors(), stepTexts(), targetOfPlace(), graph, index, lobby (+20 more)

### Community 79 - "Community 79"
Cohesion: 0.14
Nodes (31): attachAt(), clamp01(), closestBetween(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+23 more)

### Community 80 - "Community 80"
Cohesion: 0.18
Nodes (31): ContrastTable(), readToken(), BackupHistory(), formatDate(), ClientsPanel(), ClientsTable(), InstallationsTable(), LeadsTable() (+23 more)

### Community 81 - "Community 81"
Cohesion: 0.11
Nodes (29): Certificate(), Disks(), Row(), Services(), alertText(), date, dateTime, sentence() (+21 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 83 - "Community 83"
Cohesion: 0.12
Nodes (26): submit(), ClosureMarkData, SnapshotPosition, ResolvedEnd, resolveEnd(), Snap, snapToEdge(), RouteArea (+18 more)

### Community 84 - "Community 84"
Cohesion: 0.10
Nodes (29): BUILDING_SIZES, BUILDING_TYPES, date, dateTime, formatDateTime(), REJECT_REASONS, STAGES, Actions() (+21 more)

### Community 85 - "Community 85"
Cohesion: 0.11
Nodes (29): CSV_LABELS, BlocklistPanel(), PROBLEMS, DashboardPage(), downloadCsv(), filter(), TABS, Stat() (+21 more)

### Community 86 - "Community 86"
Cohesion: 0.09
Nodes (16): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+8 more)

### Community 87 - "Community 87"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 88 - "Community 88"
Cohesion: 0.15
Nodes (28): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+20 more)

### Community 89 - "Community 89"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 90 - "Community 90"
Cohesion: 0.12
Nodes (16): createFullVenue(), Db, hoursRows(), insert(), insertVenue(), point(), Row, perfEnv (+8 more)

### Community 91 - "Community 91"
Cohesion: 0.07
Nodes (30): @types/react@catalog:, @types/react, @types/react@catalog:, @types/react@catalog:, i18next@catalog:, react@catalog:, devDependencies, @biomejs/biome@catalog: (+22 more)

### Community 92 - "Community 92"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 93 - "Community 93"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 94 - "Community 94"
Cohesion: 0.12
Nodes (14): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+6 more)

### Community 95 - "Community 95"
Cohesion: 0.11
Nodes (22): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), INSTRUCTION_ACTION_LABELS, SnapshotConnectorKind, instructionPlaceholders() (+14 more)

### Community 96 - "Community 96"
Cohesion: 0.09
Nodes (18): NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), rootElement (+10 more)

### Community 97 - "Community 97"
Cohesion: 0.16
Nodes (27): hasOpeningHours(), buildSnapshot(), byId(), isColor(), isFieldValue(), isHeight(), isRecord(), pickKinds() (+19 more)

### Community 98 - "Community 98"
Cohesion: 0.18
Nodes (25): GEOMETRY_ISSUE_CODES, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+17 more)

### Community 99 - "Community 99"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 100 - "Community 100"
Cohesion: 0.10
Nodes (18): DEFAULT_INSTRUCTION_TEMPLATES, ENTRANCES, FLOORS, unitIdOf(), planRoute(), draftOf(), graph, snapshot (+10 more)

### Community 101 - "Community 101"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 102 - "Community 102"
Cohesion: 0.15
Nodes (22): newLicenseId(), InviteInput, inviteScope(), Role, ROLES, activeSuperAdmin(), Caller, callerFromToken() (+14 more)

### Community 103 - "Community 103"
Cohesion: 0.12
Nodes (21): CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, formDraft(), formFloorIds(), FormPlace, initialForm(), levelOf(), BUILDINGS (+13 more)

### Community 104 - "Community 104"
Cohesion: 0.23
Nodes (17): currentGraph(), GraphActions, useGraphActions(), setEdgeAccessible(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf() (+9 more)

### Community 105 - "Community 105"
Cohesion: 0.15
Nodes (19): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+11 more)

### Community 106 - "Community 106"
Cohesion: 0.14
Nodes (22): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+14 more)

### Community 107 - "Community 107"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 108 - "Community 108"
Cohesion: 0.09
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.has_verified_totp(), app.mfa_recovery_codes, app.mfa_required_roles(), app.user_role() (+7 more)

### Community 109 - "Community 109"
Cohesion: 0.08
Nodes (26): runs-on, steps, timeout-minutes, concurrency, cancel-in-progress, group, name, runs-on (+18 more)

### Community 110 - "Community 110"
Cohesion: 0.08
Nodes (26): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+18 more)

### Community 111 - "Community 111"
Cohesion: 0.16
Nodes (23): SnapshotPolygon, at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph() (+15 more)

### Community 112 - "Community 112"
Cohesion: 0.15
Nodes (20): aStar(), Goal, MinHeap, SearchOptions, SearchResult, Seed, BUILDING_DOOR_M, ELEVATOR_BASE_M (+12 more)

### Community 113 - "Community 113"
Cohesion: 0.15
Nodes (21): count, GraphLegend(), ITEMS, LegendStyle, Swatch(), VisibilityToggle(), useVenueGraph(), GraphStatus (+13 more)

### Community 114 - "Community 114"
Cohesion: 0.14
Nodes (21): DirectoryFilter, DirectoryFilterOptions, DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER (+13 more)

### Community 115 - "Community 115"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 116 - "Community 116"
Cohesion: 0.14
Nodes (21): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+13 more)

### Community 117 - "Community 117"
Cohesion: 0.09
Nodes (24): @types/geojson@catalog:, @types/geojson, dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, devDependencies (+16 more)

### Community 118 - "Community 118"
Cohesion: 0.20
Nodes (20): along(), anchored(), cross(), crossing(), EMPTY_PATCH, GraphChange, lerp(), nearestNode() (+12 more)

### Community 119 - "Community 119"
Cohesion: 0.20
Nodes (19): content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence(), unsubscribeUrl() (+11 more)

### Community 120 - "Community 120"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 121 - "Community 121"
Cohesion: 0.21
Nodes (17): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+9 more)

### Community 122 - "Community 122"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 123 - "Community 123"
Cohesion: 0.16
Nodes (16): graphQuery(), loadSnapshot(), loadSnapshotWithGraph(), snapshotKey(), useRouteSnapshot(), Prefetch, PrefetchHolder, take() (+8 more)

### Community 124 - "Community 124"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 125 - "Community 125"
Cohesion: 0.17
Nodes (20): distanceM(), CONNECTOR_ACTIONS, connectorSteps(), INSTRUCTION_PLACEHOLDERS, InstructionPlaceholder, pointStep(), routeSteps(), StepFloor (+12 more)

### Community 126 - "Community 126"
Cohesion: 0.18
Nodes (21): canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph(), FACILITY_ICON_COLORS, FACILITY_ICON_FALLBACK, facilityIconId(), FacilityIconSpec (+13 more)

### Community 127 - "Community 127"
Cohesion: 0.18
Nodes (17): channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI, BrandColors (+9 more)

### Community 128 - "Community 128"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 129 - "Community 129"
Cohesion: 0.25
Nodes (18): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+10 more)

### Community 130 - "Community 130"
Cohesion: 0.23
Nodes (18): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+10 more)

### Community 131 - "Community 131"
Cohesion: 0.10
Nodes (21): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+13 more)

### Community 132 - "Community 132"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 133 - "Community 133"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 134 - "Community 134"
Cohesion: 0.17
Nodes (17): BrandingFormErrors, BrandingFormValues, ColorNote, MESSAGES, ratio, Branding, BRANDING_KEYS, BrandingInput (+9 more)

### Community 135 - "Community 135"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 136 - "Community 136"
Cohesion: 0.13
Nodes (16): Demo(), DemoBoundary, DemoMap, DEMO_URL, OUTCOMES, pending, postVerify(), RequestResult (+8 more)

### Community 137 - "Community 137"
Cohesion: 0.22
Nodes (18): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, installation(), num(), numOrNull() (+10 more)

### Community 138 - "Community 138"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 139 - "Community 139"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 140 - "Community 140"
Cohesion: 0.17
Nodes (17): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+9 more)

### Community 141 - "Community 141"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 142 - "Community 142"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 143 - "Community 143"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 144 - "Community 144"
Cohesion: 0.12
Nodes (18): @indoor/domain, @biomejs/biome, dependencies, @indoor/domain@workspace:*, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog: (+10 more)

### Community 145 - "Community 145"
Cohesion: 0.13
Nodes (13): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.hosting_mode(), hosting.capacity() (+5 more)

### Community 146 - "Community 146"
Cohesion: 0.12
Nodes (10): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota, app.guard_venue_slug(), venues_slug_guard (+2 more)

### Community 147 - "Community 147"
Cohesion: 0.13
Nodes (15): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+7 more)

### Community 148 - "Community 148"
Cohesion: 0.18
Nodes (13): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+5 more)

### Community 149 - "Community 149"
Cohesion: 0.15
Nodes (12): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+4 more)

### Community 150 - "Community 150"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 151 - "Community 151"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 152 - "Community 152"
Cohesion: 0.21
Nodes (11): data, knownClosures(), CLOSURE_REFRESH_MS, closuresQuery(), useLiveClosures(), useVenueBranding(), snapshot, VenueBrand (+3 more)

### Community 153 - "Community 153"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 154 - "Community 154"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 155 - "Community 155"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 156 - "Community 156"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 158 - "Community 158"
Cohesion: 0.15
Nodes (9): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.take_over_edit_lock() (+1 more)

### Community 159 - "Community 159"
Cohesion: 0.19
Nodes (9): vendor.checkins, vendor.clients, vendor.installations, vendor.licenses, licenses_one_active, public.vendor_installation_create(), public.vendor_license_record(), public.vendor_license_target() (+1 more)

### Community 160 - "Community 160"
Cohesion: 0.32
Nodes (12): home(), LanguageSwitch(), MobileMenu(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES, root (+4 more)

### Community 161 - "Community 161"
Cohesion: 0.29
Nodes (13): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+5 more)

### Community 162 - "Community 162"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 163 - "Community 163"
Cohesion: 0.20
Nodes (13): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toPatch(), validate(), submit() (+5 more)

### Community 165 - "Community 165"
Cohesion: 0.19
Nodes (11): Db, DEMO_USERS, demoClosures(), demoEmail(), DemoUser, hoursFromNow(), RELEASE_NOTES, seedDemoUsers() (+3 more)

### Community 166 - "Community 166"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 167 - "Community 167"
Cohesion: 0.25
Nodes (12): mapDisplaySettingsRow(), CameraViewSchema, COLOR_KINDS, DISPLAY_MODES, HEIGHT_KINDS, HeightSchema, isRecord(), MAX_HEIGHT_M (+4 more)

### Community 168 - "Community 168"
Cohesion: 0.14
Nodes (9): ClosureFeature, connectors, edges, graph, hall, nodes, now, options (+1 more)

### Community 169 - "Community 169"
Cohesion: 0.15
Nodes (13): depends_on, image, restart, condition, aliases, db, depends_on, image (+5 more)

### Community 170 - "Community 170"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 171 - "Community 171"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 172 - "Community 172"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 173 - "Community 173"
Cohesion: 0.22
Nodes (10): hhmm(), isOpenAt(), localParts(), minutes(), OpeningHours, OpeningHoursProblem, OpeningSpan, shiftDate() (+2 more)

### Community 174 - "Community 174"
Cohesion: 0.22
Nodes (10): DEFAULT_OUTLINE, isConnector, isPolygon, REFERENCE_LAYER_IDS, REFERENCE_OPACITY, referenceFeatureLayers(), ReferenceFloor, removeReference() (+2 more)

### Community 175 - "Community 175"
Cohesion: 0.32
Nodes (9): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), RFC-4180, guessDelimiter(), parseCsv(), toCsv() (+1 more)

### Community 176 - "Community 176"
Cohesion: 0.36
Nodes (4): vite-plugin-pwa@catalog:, vite-plugin-pwa, thirdPartyNotices(), UI_FONT_NOTICES

### Community 177 - "Community 177"
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 178 - "Community 178"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 179 - "Community 179"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 180 - "Community 180"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 181 - "Community 181"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 183 - "Community 183"
Cohesion: 0.30
Nodes (8): gridGraph(), { performance }, distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 184 - "Community 184"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 185 - "Community 185"
Cohesion: 0.38
Nodes (9): columnIndex(), columnName(), escapeXml(), firstSheetPath(), readXlsx(), texts(), unescapeXml(), writeXlsx() (+1 more)

### Community 186 - "Community 186"
Cohesion: 0.24
Nodes (8): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target

### Community 187 - "Community 187"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 188 - "Community 188"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 189 - "Community 189"
Cohesion: 0.29
Nodes (6): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NotificationKind, NotificationPreferences, withDefaultPreferences()

### Community 190 - "Community 190"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 191 - "Community 191"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 192 - "Community 192"
Cohesion: 0.22
Nodes (10): environment, ALLOWED_ORIGINS, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY (+2 more)

### Community 193 - "Community 193"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 194 - "Community 194"
Cohesion: 0.29
Nodes (8): areaFilter(), CLOSURE_COLOR, CLOSURE_LAYER_IDS, CLOSURE_SOURCE_ID, closureCollection(), closureLayers(), ClosureMarks, setClosureMarks()

### Community 195 - "Community 195"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 197 - "Community 197"
Cohesion: 0.22
Nodes (9): command, environment, image, restart, volumes, PGPORT, POSTGRES_DB, POSTGRES_PASSWORD (+1 more)

### Community 198 - "Community 198"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 199 - "Community 199"
Cohesion: 0.22
Nodes (3): baseline, pg_temp.current(), pg_temp.requests()

### Community 200 - "Community 200"
Cohesion: 0.31
Nodes (5): createTrialRepository(), TrialRepository, repoReturning(), HOSTED_TRIAL_DELETE_AFTER_DAYS, HostedTrialStatus

### Community 201 - "Community 201"
Cohesion: 0.25
Nodes (7): compilerOptions, jsx, lib, types, extends, include, ../tsconfig.base.json

### Community 202 - "Community 202"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 203 - "Community 203"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 204 - "Community 204"
Cohesion: 0.29
Nodes (6): EXTENSION_BY_MIME, ImageFileCheck, ImageFileProblem, ImageMime, MAX_IMAGE_BYTES, MIME_BY_EXTENSION

### Community 205 - "Community 205"
Cohesion: 0.25
Nodes (4): originPointUrl(), BASE, corridor, empty

### Community 206 - "Community 206"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 208 - "Community 208"
Cohesion: 0.43
Nodes (5): apply(), saved(), systemDark(), Theme, ThemeToggle()

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

### Community 215 - "Community 215"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 216 - "Community 216"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 217 - "Community 217"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 218 - "Community 218"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 219 - "Community 219"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

### Community 220 - "Community 220"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 221 - "Community 221"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 222 - "Community 222"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.33
Nodes (3): graph, NOW, source

### Community 224 - "Community 224"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 225 - "Community 225"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 226 - "Community 226"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 227 - "Community 227"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 228 - "Community 228"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 229 - "Community 229"
Cohesion: 0.60
Nodes (4): BrandingPreview(), CHIPS, Mark(), RouteSketch()

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
- **5 isolated node(s):** `RFC-6238`, `TARGETS`, `RFC-4180`, `RFC-2045`, `RFC-2387`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2471 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **75 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Community 1` to `Community 129`, `Community 2`, `Community 130`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 136`, `Community 11`, `Community 140`, `Community 16`, `Community 20`, `Community 22`, `Community 23`, `Community 27`, `Community 160`, `Community 41`, `Community 42`, `Community 45`, `Community 49`, `Community 50`, `Community 55`, `Community 76`, `Community 77`, `Community 78`, `Community 208`, `Community 80`, `Community 84`, `Community 85`, `Community 229`, `Community 121`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `TARGETS`, `RFC-4180` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.027432373472949387 - nodes in this community are weakly interconnected._
- **Why does `react-i18next` connect `Community 27` to `Community 96`, `Community 161`, `Community 4`, `Community 71`, `Community 40`, `Community 11`, `Community 78`, `Community 16`, `Community 20`, `Community 23`, `Community 24`, `Community 91`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04939336438387672 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 12` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 11`, `Community 13`, `Community 16`, `Community 17`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 152`, `Community 26`, `Community 31`, `Community 163`, `Community 165`, `Community 39`, `Community 167`, `Community 41`, `Community 49`, `Community 50`, `Community 55`, `Community 61`, `Community 200`, `Community 205`, `Community 79`, `Community 84`, `Community 85`, `Community 86`, `Community 94`, `Community 103`, `Community 113`, `Community 123`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.031743152548521676 - nodes in this community are weakly interconnected._