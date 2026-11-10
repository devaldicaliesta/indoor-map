# Graph Report - indoor-map  (2026-11-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 8187 nodes · 25906 edges · 292 communities (218 shown, 74 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 389 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b3621e50`
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
- Community 224
- Community 225
- Community 227
- Community 228
- Community 229
- Community 230
- Community 231
- Community 232
- Community 236
- Community 239
- Community 240
- Community 241
- Community 242
- Community 243
- Community 244
- Community 248

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
- `Demo` --references--> `Venue`  [EXTRACTED]
  e2e/tests/visitor/verify/T-320-demo-venues.spec.ts → packages/domain/src/venue.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `OriginPointDraft` --references--> `Position`  [EXTRACTED]
  apps/admin/src/features/origin-points/queries.ts → packages/domain/src/geometry.ts

## Import Cycles
- None detected.

## Communities (292 total, 74 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (132): BrandGallery(), Section(), ContrastTable(), readToken(), SURFACES, TEXT_PAIRS, TOKENS, UiGalleryPage() (+124 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (129): ColorField(), isColorValue(), Field(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FacilityIconPreview() (+121 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (87): RFC-6238, createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+79 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (108): submit(), haversineM(), SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft (+100 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (112): Can(), GRACE_READ_ONLY_HINT, useCan(), useLicenseReadOnly(), useRole(), useCurrentProfile(), DataTableGallery(), HomeRedirect() (+104 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (105): FormNotice(), floorLabel(), ConnectorDialog(), ConnectorFormBody(), useVenueFloors(), DeleteFacilityTypeDialog(), CadLayers(), meters (+97 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (110): PlaceSources, RouteSources, LocationPlace, Place, SnapshotIndex, PolygonSchema, PositionSchema, hasOpeningHours() (+102 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (25): Fixtures, FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, TestVenue, unitSquare(), VisitorPage (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (91): base, snapshot, facility, index, snapshot, index, snapshot, at() (+83 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (95): COLUMNS, date, DEMO_STATES, DemoState, FILTERS, FLOORS, NAMES, Room (+87 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (81): submit(), createAuthRepository(), signOut(), TablesUpdate, CODE_RULES, CodeRule, DataError, DataErrorKind (+73 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (61): seedPublishHistory(), envFile, VENUES, CONTEXT, VENUES, airportVenue(), dailyHours(), FloorUnit (+53 more)

### Community 12 - "Community 12"
Cohesion: 0.03
Nodes (34): VenueSelection, CategoriesRepository, FeaturesRepository, LocationTypesRepository, LocationsRepository, PublicationsRepository, createSnapshotsRepository(), SERVICE_INACTIVE (+26 more)

### Community 13 - "Community 13"
Cohesion: 0.05
Nodes (78): LandingPage(), home(), LanguageSwitch(), privacyPage(), SiteFooter(), SiteHeader(), Copy, COPY (+70 more)

### Community 14 - "Community 14"
Cohesion: 0.04
Nodes (60): NON_RETRYABLE, queryClient, DataClient, DataClientConfig, AliasesRepository, aliasKey(), AliasRow, createAliasesRepository() (+52 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (71): PanelMessage(), useVisitorTour(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX (+63 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (83): loadCrowd(), areaSpots(), arrive(), between(), blankPerson(), buildNets(), createCrowd(), Crowd (+75 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (77): DEV_KEY, newDb(), signedLicense(), signIn(), DEV_KEY, newDb(), paidLicense(), signIn() (+69 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (66): currentProfileKey, data, useVenueSelection, venuesKey, FILTERS, Open, facilityIconSpecs(), facilityTypesKey() (+58 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (71): FeatureKind, MapLabel, COORDINATE_DECIMALS, DEFAULT_FILL, DEFAULT_HEIGHTS, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, POINT_COLOR (+63 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (65): closureMarks(), useClosureMap(), CameraPadding, fitBearing(), focusCamera(), InitialCamera, initialCamera(), MAP_GAP_PX (+57 more)

### Community 21 - "Community 21"
Cohesion: 0.04
Nodes (40): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+32 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (56): others, TimezoneSelect(), VenuePicker(), MODULE_NAV, ModuleNav, ROLE_LABELS, AREA_KINDS, targetKey() (+48 more)

### Community 23 - "Community 23"
Cohesion: 0.03
Nodes (43): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, AuthRepository, EMAIL_UNAVAILABLE_PREFIXES (+35 more)

### Community 24 - "Community 24"
Cohesion: 0.06
Nodes (51): DEFAULT_OUTLINE, Corners, attributed, Basemap, BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID, firstLayerAfterBackground(), setBasemap() (+43 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (71): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react@catalog:, @types/react-dom@catalog: (+63 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (56): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+48 more)

### Community 27 - "Community 27"
Cohesion: 0.05
Nodes (36): TestRouteState, SheetSnap, RouteGraphStatus, closure(), ExploreContext, ExploreData, ExploreProvider(), loadSearch() (+28 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (23): submit(), ACCOUNTS, env, envFile, AdminShell, appServers, args, CI (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (33): createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId(), DEV_KEY, devLicenseFile(), releaseLicense() (+25 more)

### Community 30 - "Community 30"
Cohesion: 0.05
Nodes (47): Georeferencer, LngLat, createGraphInteractions(), onMove(), onUp(), preview(), snapped(), GraphInteractionOptions (+39 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (52): all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage(), start (+44 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (54): AppLayout(), NarrowScreenNotice(), subscribe(), NavItem(), Sidebar(), SidebarState, useSidebar, columns (+46 more)

### Community 33 - "Community 33"
Cohesion: 0.07
Nodes (49): app.check_edge_same_floor(), app.on_venue_created(), app.touch_updated_at(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+41 more)

### Community 34 - "Community 34"
Cohesion: 0.07
Nodes (55): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+47 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (51): copy(), BPM, Copy, COPY, EN, ID, SCENES, assets (+43 more)

### Community 36 - "Community 36"
Cohesion: 0.06
Nodes (42): Json, listPage(), Page, PAGE_SIZE, PageQuery, pageRange(), PageResponse, ActorRow (+34 more)

### Community 37 - "Community 37"
Cohesion: 0.07
Nodes (41): Tables, geometryFromColumn(), geometryToColumn(), nullableGeometryFromColumn(), positionFromColumn(), fetchAllPages(), createConnectorsRepository(), createFeaturesRepository() (+33 more)

### Community 38 - "Community 38"
Cohesion: 0.06
Nodes (40): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+32 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (35): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_code_unique, locations_release_units, public.categories, public.facility_types, public.field_definitions (+27 more)

### Community 40 - "Community 40"
Cohesion: 0.10
Nodes (47): resize(), FALLBACK_CENTER, footprintBox(), loadImageSize(), Measure, startingPlacement(), useGeoreference(), calibrate() (+39 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (29): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+21 more)

### Community 42 - "Community 42"
Cohesion: 0.08
Nodes (41): initialAuthRedirectHash, AuthLayout(), ForgotPasswordPage(), ACTIVITY_EVENTS, clearActivity(), markActivity(), readLastActivity(), useIdleSignOut() (+33 more)

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (41): InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), distanceM(), INSTRUCTION_ACTION_LABELS, CONNECTOR_ACTIONS (+33 more)

### Community 44 - "Community 44"
Cohesion: 0.09
Nodes (39): drawKindLabel(), drawKindValue(), OUTDOOR_SUBTYPE_LABELS, UNIT_STATUS_LABELS, KindPicker(), choose(), createForUnit(), editorQueues() (+31 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (44): expected(), mapCategoryRow(), customFieldsOf(), FloorEmbed, hoursToRows(), IMAGE_EXTENSIONS, IMPORT_BATCH, LocationImages (+36 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (28): createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor, FeatureEditorCallbacks, hitsGeometry() (+20 more)

### Community 47 - "Community 47"
Cohesion: 0.07
Nodes (35): RFC-2045, RFC-2387, accepted(), claim(), logError(), NoticeRow, release(), text() (+27 more)

### Community 48 - "Community 48"
Cohesion: 0.08
Nodes (38): InsertedVenue, SnapshotConnector, SnapshotNavEdge, SnapshotNavNode, SnapshotPolygon, SnapshotSource, AIRLINES, FOOD (+30 more)

### Community 49 - "Community 49"
Cohesion: 0.05
Nodes (46): lucide-react@catalog:, react-dom@catalog:, lucide-react, react-dom, react-dom@catalog:, lucide-react@catalog:, react-dom@catalog:, dependencies (+38 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (26): combinedSave(), EditorState, EMPTY_GRAPH, GRAPH_SHOWN, GRAPH_TOOLS, IDLE, SaveSource, floorId (+18 more)

### Community 51 - "Community 51"
Cohesion: 0.06
Nodes (33): app.user_role(), public.profiles, app.hook_password_verification_attempt(), app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin, profiles_log_changes, app.hook_password_verification_attempt() (+25 more)

### Community 52 - "Community 52"
Cohesion: 0.08
Nodes (30): LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search(), waitForMail() (+22 more)

### Community 53 - "Community 53"
Cohesion: 0.08
Nodes (35): submit(), ConnectorDialogState, useConnectorDialog, changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formDraft() (+27 more)

### Community 54 - "Community 54"
Cohesion: 0.07
Nodes (38): endPlace(), endTarget(), featureAt(), placeEnd(), SharedState, sharedState(), shareLink(), facility (+30 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (17): capture(), shot(), capture(), shot(), capture(), shot(), FIELDS, perfEnv (+9 more)

### Community 56 - "Community 56"
Cohesion: 0.12
Nodes (34): HOSTED_TRIAL_DAYS, content(), dateText(), dateTimeText(), NoticeDetails, NoticeEmail, renderAccountNotice(), sentence() (+26 more)

### Community 57 - "Community 57"
Cohesion: 0.09
Nodes (34): applyEntitlements(), enabledFeatures(), FEATURE_LABELS, PAID_FEATURES, snapshotGraphPath(), splitSnapshot(), hasBlockingFindings(), venueToday() (+26 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (33): ClosureDialogState, closureTargetAt(), interceptCanvasClick(), ClosureMenu, CONTROL_LABELS, EditorCanvas(), FALLBACK_CENTER, PlanBackground (+25 more)

### Community 59 - "Community 59"
Cohesion: 0.10
Nodes (29): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+21 more)

### Community 60 - "Community 60"
Cohesion: 0.06
Nodes (41): @indoor/data@workspace:*, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, @indoor/data@workspace:*, @indoor/domain@workspace:*, @playwright/test@catalog:, @types/node@catalog: (+33 more)

### Community 61 - "Community 61"
Cohesion: 0.09
Nodes (13): EditorPage, EditorTool, at(), drawUnit(), ring(), square(), unitsOn(), diagnoseWriteRejection() (+5 more)

### Community 62 - "Community 62"
Cohesion: 0.08
Nodes (34): customFieldInput(), UnitStatus, FeatureId, IMPORT_STANDARD_COLUMNS, ImportContext, ImportPlan, ImportRow, parseImportDate() (+26 more)

### Community 63 - "Community 63"
Cohesion: 0.09
Nodes (35): DirectoryFilterOptions, directoryFilterOptions(), DirectoryGroup, directoryGroups(), directoryLetter(), directoryLocations(), matchesPlace(), NO_DIRECTORY_FILTER (+27 more)

### Community 64 - "Community 64"
Cohesion: 0.12
Nodes (36): IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor(), finding() (+28 more)

### Community 65 - "Community 65"
Cohesion: 0.05
Nodes (41): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+33 more)

### Community 66 - "Community 66"
Cohesion: 0.14
Nodes (35): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, adminScreenRect(), coverZoom(), cursor(), cursorPath() (+27 more)

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (28): ListTab, EntranceField(), EntranceState, IDLE, useEntranceStore, EntrancesPanel(), suggest(), FeatureButton() (+20 more)

### Community 68 - "Community 68"
Cohesion: 0.09
Nodes (32): PlaceDisplay, floorText(), KIND_ORDER, placeKey(), PlaceKind, placeName(), PlaceOption, placeOptions() (+24 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 70 - "Community 70"
Cohesion: 0.11
Nodes (29): useAuthSync(), RequireAuth(), downloadText(), message(), RecoveryCodeForm(), submit(), RecoveryCodesList(), TotpCodeForm() (+21 more)

### Community 71 - "Community 71"
Cohesion: 0.14
Nodes (31): ClosureDialog(), ClosureForm(), NO_CLOSURES, useClosureDialog, ClosurePlaces, fromVenueInput(), impactText(), offsetMs() (+23 more)

### Community 72 - "Community 72"
Cohesion: 0.11
Nodes (31): Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date, dateTime (+23 more)

### Community 73 - "Community 73"
Cohesion: 0.05
Nodes (38): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+30 more)

### Community 74 - "Community 74"
Cohesion: 0.07
Nodes (24): app.trial_venue(), hosting.trials, app.venue_locked(), hosting.blocklist, hosting.capacity(), hosting.trial_requests, public.hosting_request_get(), public.hosting_request_requeue() (+16 more)

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (21): app.can_access_floor(), app.can_access_location(), app.can_access_venue(), app.shares_accessible_profile(), public.venue_members, venue_members_user_idx, app.accessible_venue_ids(), app.all_venues_user() (+13 more)

### Community 76 - "Community 76"
Cohesion: 0.09
Nodes (34): EDITOR_CAM, EditorState, PUBLISH_BUTTON, TOOLS, VALIDATE_BUTTON, ADMIN_H, ADMIN_W, Connector (+26 more)

### Community 77 - "Community 77"
Cohesion: 0.14
Nodes (27): VenueSpec, PictogramKey, airportStation, campus, custom, factoryWarehouse, hospital, hours (+19 more)

### Community 78 - "Community 78"
Cohesion: 0.10
Nodes (29): LicenseRejection, InviteInput, inviteScope(), Role, ROLES, askVendor(), checkIn(), CheckinFailure (+21 more)

### Community 79 - "Community 79"
Cohesion: 0.08
Nodes (24): licenses_one_current, public.installation, public.licenses, app.license_active(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+16 more)

### Community 80 - "Community 80"
Cohesion: 0.10
Nodes (24): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, ensureStyle(), findTourTarget(), reducedMotion(), runTour(), TourEnd (+16 more)

### Community 81 - "Community 81"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 82 - "Community 82"
Cohesion: 0.06
Nodes (35): @biomejs/biome, dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/node@catalog: (+27 more)

### Community 83 - "Community 83"
Cohesion: 0.12
Nodes (26): placeOfTarget(), RouteFailure, routeFailure(), routeFloors(), stepTexts(), targetOfPlace(), graph, index (+18 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (33): @types/node, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+25 more)

### Community 85 - "Community 85"
Cohesion: 0.10
Nodes (22): toFeatureColumns(), areaM2(), polygonAreaM2(), ringAreaM2(), roundAreaM2(), LinearRingSchema, LineString, LineStringSchema (+14 more)

### Community 86 - "Community 86"
Cohesion: 0.10
Nodes (10): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), checkTable(), IMPORT_HEADER, shot(), openAuditTab() (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (24): FOCUS_MIN_ZOOM, focusZoom(), geometryBounds(), createSelectionInteractions(), onDown(), onMove(), onUp(), preview() (+16 more)

### Community 88 - "Community 88"
Cohesion: 0.07
Nodes (32): @indoor/ui@workspace:*, @tanstack/react-query@catalog:, @indoor/ui, @tanstack/react-query, dependencies, @indoor/domain@workspace:*, @indoor/ui@workspace:*, lucide-react@catalog: (+24 more)

### Community 89 - "Community 89"
Cohesion: 0.06
Nodes (31): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+23 more)

### Community 90 - "Community 90"
Cohesion: 0.09
Nodes (19): currentGraph(), GraphActions, newDb(), signIn(), setEdgeAccessible(), EntranceSuggestion, Position, GraphPatch (+11 more)

### Community 91 - "Community 91"
Cohesion: 0.07
Nodes (31): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+23 more)

### Community 92 - "Community 92"
Cohesion: 0.08
Nodes (16): LicenseRepository, PaidFeature, GRACE_DAYS, importTooLarge(), LicenseLimits, LicenseNotice, LIMIT_KINDS, LIMIT_LABELS (+8 more)

### Community 93 - "Community 93"
Cohesion: 0.10
Nodes (25): ahead(), ORIGIN_LAYER_IDS, ORIGIN_SOURCE_ID, originCollection(), originLayers(), OriginMarker, appliedColors, feature() (+17 more)

### Community 94 - "Community 94"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 95 - "Community 95"
Cohesion: 0.12
Nodes (14): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+6 more)

### Community 96 - "Community 96"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (30): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+22 more)

### Community 98 - "Community 98"
Cohesion: 0.08
Nodes (18): NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), rootElement (+10 more)

### Community 99 - "Community 99"
Cohesion: 0.12
Nodes (25): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+17 more)

### Community 100 - "Community 100"
Cohesion: 0.15
Nodes (25): inVenueTime(), OUTDOOR, ChangeSummary(), ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey() (+17 more)

### Community 101 - "Community 101"
Cohesion: 0.13
Nodes (26): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toPatch(), validate(), submit() (+18 more)

### Community 102 - "Community 102"
Cohesion: 0.10
Nodes (20): PublishedVenue, globalSetup(), Attempt, RoleTargets, SERVER_ATTEMPTS, SQUARE, as(), ROLES (+12 more)

### Community 103 - "Community 103"
Cohesion: 0.16
Nodes (25): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+17 more)

### Community 104 - "Community 104"
Cohesion: 0.07
Nodes (22): attr(), brandDir, { chromium }, emailWidth, logo, outputs, paths, pngs (+14 more)

### Community 105 - "Community 105"
Cohesion: 0.18
Nodes (20): connectorsKey(), syncStop(), useConnectorMutations(), useConnectors(), CLOSURE_REFRESH_MS, useCurrentClosures(), useVenueGraph(), venueGraphKey() (+12 more)

### Community 106 - "Community 106"
Cohesion: 0.07
Nodes (28): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+20 more)

### Community 107 - "Community 107"
Cohesion: 0.09
Nodes (26): dependencies, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:*, pdfjs-dist@catalog:, react@catalog:, react-router@catalog:, zustand@catalog: (+18 more)

### Community 108 - "Community 108"
Cohesion: 0.08
Nodes (26): @indoor/map-core@workspace:*, @indoor/routing@workspace:*, @indoor/map-core, @indoor/routing, dependencies, @indoor/domain@workspace:*, @indoor/map-core@workspace:*, @indoor/routing@workspace:* (+18 more)

### Community 109 - "Community 109"
Cohesion: 0.15
Nodes (19): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), EULA_VERSION, isEulaVersion() (+11 more)

### Community 110 - "Community 110"
Cohesion: 0.13
Nodes (23): BrandingFormErrors, BrandingFormValues, ColorNote, colorNotes(), livePreview(), MESSAGES, ratio, empty (+15 more)

### Community 111 - "Community 111"
Cohesion: 0.18
Nodes (25): canvasArea(), unitCorner(), drawPlan(), camera(), deskAndMonitor(), LOBBY, lobby(), MONITOR (+17 more)

### Community 112 - "Community 112"
Cohesion: 0.09
Nodes (15): public.system_settings, public.public_visitor_url(), app.purge_audit_events(), public.user_data_delete(), app.has_verified_totp(), app.mfa_recovery_codes, app.mfa_required_roles(), app.user_role() (+7 more)

### Community 113 - "Community 113"
Cohesion: 0.16
Nodes (25): clamp01(), firstPosition(), inside(), LinkTargets, nearestOnGraph(), nearestOnOutline(), nearestOutlineToGraph(), onSegment() (+17 more)

### Community 114 - "Community 114"
Cohesion: 0.24
Nodes (22): attachAt(), closestBetween(), along(), anchored(), cross(), crossing(), distance(), EMPTY_PATCH (+14 more)

### Community 115 - "Community 115"
Cohesion: 0.14
Nodes (21): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+13 more)

### Community 116 - "Community 116"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 117 - "Community 117"
Cohesion: 0.17
Nodes (19): channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI, applyBranding() (+11 more)

### Community 118 - "Community 118"
Cohesion: 0.12
Nodes (15): public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), public.publish_begin(), public.publish_commit(), public.acquire_edit_lock() (+7 more)

### Community 119 - "Community 119"
Cohesion: 0.12
Nodes (21): filter(), Stat(), Summary(), BlockValueCheck, LEADS_CSV_HEADER, leadsCsv(), LeadsCsvLabels, leadStage() (+13 more)

### Community 120 - "Community 120"
Cohesion: 0.15
Nodes (6): _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 121 - "Community 121"
Cohesion: 0.26
Nodes (14): useGraphActions(), addEntrance(), linkTargets(), applyEntrances(), linkEntrance(), removeEntrancesOf(), Draft, sameEdge() (+6 more)

### Community 122 - "Community 122"
Cohesion: 0.15
Nodes (18): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+10 more)

### Community 123 - "Community 123"
Cohesion: 0.13
Nodes (11): createCadConverterRepository(), post(), InfoPointsRepository, dxf, checkInfoPointInput(), INFO_POINT_IDLE_RANGE, InfoPoint, InfoPointInput (+3 more)

### Community 124 - "Community 124"
Cohesion: 0.19
Nodes (20): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, hhmm(), openingHoursFromRows(), installation() (+12 more)

### Community 125 - "Community 125"
Cohesion: 0.19
Nodes (20): canvas2d(), drawBadge(), drawGlyph(), drawPlaceholderGlyph(), FACILITY_ICON_COLORS, FACILITY_ICON_FALLBACK, facilityIconId(), fitContain() (+12 more)

### Community 126 - "Community 126"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 127 - "Community 127"
Cohesion: 0.14
Nodes (18): move(), checkFacilityIconFile(), checkFacilityTypeName(), FACILITY_TYPE_NAME_MAX, FacilityIconFileCheck, FacilityIconFileProblem, FacilityIconFormat, FacilityTypeNameProblem (+10 more)

### Community 128 - "Community 128"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 129 - "Community 129"
Cohesion: 0.10
Nodes (20): typescript, dependencies, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./fixtures/* (+12 more)

### Community 130 - "Community 130"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 131 - "Community 131"
Cohesion: 0.11
Nodes (19): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, exports, ./styles.css, ./worker (+11 more)

### Community 132 - "Community 132"
Cohesion: 0.20
Nodes (16): trialEnv(), trialSmtpConfig(), TRIAL_ENDED, activate(), Activation, adminUrl, getRequest(), logError() (+8 more)

### Community 133 - "Community 133"
Cohesion: 0.23
Nodes (15): FEATURE_KIND_LABELS, CommitInput(), FacilityFields(), hasHeight(), HeightField(), MESSAGES, number, MultiSelectionPanel() (+7 more)

### Community 134 - "Community 134"
Cohesion: 0.14
Nodes (13): PhoneState, ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paths (+5 more)

### Community 135 - "Community 135"
Cohesion: 0.10
Nodes (19): runs-on, steps, concurrency, cancel-in-progress, group, jobs, check, name (+11 more)

### Community 136 - "Community 136"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 137 - "Community 137"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+11 more)

### Community 138 - "Community 138"
Cohesion: 0.16
Nodes (17): count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS, changeCount() (+9 more)

### Community 139 - "Community 139"
Cohesion: 0.16
Nodes (16): drawRoute(), strokeRoute(), camera(), dataLoop(), devices(), K, LOOP, OUTLINE (+8 more)

### Community 140 - "Community 140"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 141 - "Community 141"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 142 - "Community 142"
Cohesion: 0.13
Nodes (13): app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.server_settings, app.sync_service(), app.hosting_mode() (+5 more)

### Community 143 - "Community 143"
Cohesion: 0.13
Nodes (16): saveValid(), { chromium }, envFile, locationId(), OUT, require, rest(), root (+8 more)

### Community 144 - "Community 144"
Cohesion: 0.14
Nodes (16): FIELD_PROBLEM_MESSAGES, useTypeChoice(), change(), lostOnChange(), CustomFieldProblem, customFieldsSchema(), FIELD_LABEL_MAX, FIELD_TEXT_MAX (+8 more)

### Community 145 - "Community 145"
Cohesion: 0.18
Nodes (13): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+5 more)

### Community 146 - "Community 146"
Cohesion: 0.11
Nodes (11): eastGf, facilities, index, [main, east], mainGf, mainL1, mainL2, outdoor (+3 more)

### Community 147 - "Community 147"
Cohesion: 0.12
Nodes (17): devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vite@catalog:, vitest@catalog:, exports, vite (+9 more)

### Community 148 - "Community 148"
Cohesion: 0.12
Nodes (17): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+9 more)

### Community 149 - "Community 149"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 150 - "Community 150"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 151 - "Community 151"
Cohesion: 0.12
Nodes (16): dependencies, @indoor/domain@workspace:*, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, vitest (+8 more)

### Community 152 - "Community 152"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 153 - "Community 153"
Cohesion: 0.16
Nodes (11): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+3 more)

### Community 154 - "Community 154"
Cohesion: 0.15
Nodes (9): audit_events_occurred_idx, public.audit_events, public.edit_locks, app.floor_writable(), public.release_edit_lock(), public.take_over_edit_lock(), public.search_audit_events(), public.take_over_edit_lock() (+1 more)

### Community 155 - "Community 155"
Cohesion: 0.29
Nodes (13): BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap(), FULL_TOP_GAP_PX (+5 more)

### Community 156 - "Community 156"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 158 - "Community 158"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 159 - "Community 159"
Cohesion: 0.19
Nodes (10): app.enforce_publish_per_day(), app.enforce_quota(), app.enforce_storage_quota(), app.license_is_trial(), features_quota, locations_quota, objects_license_quota, origin_points_quota (+2 more)

### Community 160 - "Community 160"
Cohesion: 0.26
Nodes (12): WithTooltip(), EditorToolbar(), HistoryButton(), TOOLS, isTyping(), TOOL_BY_KEY, TOOL_SHORTCUTS, UNDO_SHORTCUT (+4 more)

### Community 161 - "Community 161"
Cohesion: 0.26
Nodes (11): choose(), downloadCsvTemplate(), downloadXlsxTemplate(), readTable(), save(), slug(), RFC-4180, guessDelimiter() (+3 more)

### Community 162 - "Community 162"
Cohesion: 0.20
Nodes (8): contrastOn(), enableAutoTours(), luminance(), resetTourProgress(), TourPopover, tourProgress(), openVenue(), PHONE_EN

### Community 163 - "Community 163"
Cohesion: 0.20
Nodes (9): ConnectorInput, ConnectorRow, ConnectorsRepository, isDirection(), isKind(), mapConnectorRow(), row, ConnectorDraft (+1 more)

### Community 164 - "Community 164"
Cohesion: 0.24
Nodes (8): createNotificationsRepository(), NotificationsRepository, isNotificationKind(), NOTIFICATION_KINDS, NotificationKind, NotificationPreferences, RECIPIENT_ROLES, withDefaultPreferences()

### Community 165 - "Community 165"
Cohesion: 0.20
Nodes (12): TRIAL_MAX_DAYS, checkTrialRequest(), createRateLimiter(), hasControl(), HostedTrialRequestCheck, HostedTrialRequestInput, isEmail(), LIMITS (+4 more)

### Community 166 - "Community 166"
Cohesion: 0.33
Nodes (11): infoPointsKey(), useRemoveInfoPoint(), useSaveInfoPoint(), OriginPointDraft, originPointsKey(), SnapError, toChanges(), useOriginPoints() (+3 more)

### Community 167 - "Community 167"
Cohesion: 0.35
Nodes (3): page, thirdPartyNotices(), UI_FONT_NOTICES

### Community 168 - "Community 168"
Cohesion: 0.23
Nodes (10): SearchField(), useDebouncedValue(), SEARCH_DEBOUNCE_MS, SEARCH_RESULTS_ID, VenueSearch(), onKeyDown(), submit(), OnScreenKeyboard() (+2 more)

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
Cohesion: 0.17
Nodes (12): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+4 more)

### Community 173 - "Community 173"
Cohesion: 0.24
Nodes (3): ConversionError, render_svg(), RenderTest

### Community 174 - "Community 174"
Cohesion: 0.18
Nodes (10): domainGraph(), filesIn(), functionsDir, root, specifiers(), [command, ...args], env, result (+2 more)

### Community 175 - "Community 175"
Cohesion: 0.17
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 176 - "Community 176"
Cohesion: 0.30
Nodes (8): gridGraph(), { performance }, distance(), graphCost(), random(), randomGraph(), RandomGraphOptions, referenceCost()

### Community 177 - "Community 177"
Cohesion: 0.20
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 178 - "Community 178"
Cohesion: 0.38
Nodes (9): columnIndex(), columnName(), escapeXml(), firstSheetPath(), readXlsx(), texts(), unescapeXml(), writeXlsx() (+1 more)

### Community 179 - "Community 179"
Cohesion: 0.24
Nodes (8): AUDIT_LABELS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel(), SETTING_FIELDS, target

### Community 180 - "Community 180"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 181 - "Community 181"
Cohesion: 0.18
Nodes (10): image, restart, name, services, cad, volumes, caddy-config, caddy-data (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.24
Nodes (9): BASE, corridor, EMPTY, FEATURES, m(), near(), point(), unit() (+1 more)

### Community 183 - "Community 183"
Cohesion: 0.20
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 184 - "Community 184"
Cohesion: 0.29
Nodes (8): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.notify_super_admins(), app.server_health, backup_runs_finished_idx, public.system_health()

### Community 185 - "Community 185"
Cohesion: 0.38
Nodes (6): useVenueBranding(), snapshot, VenueBrand, venueBrand(), brandDisplayName(), ROUTE_COLOR

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
Cohesion: 0.32
Nodes (3): FacilityTypesRepository, FacilityTypeInput, FacilityTypeId

### Community 195 - "Community 195"
Cohesion: 0.36
Nodes (7): Db, DEMO_USERS, demoClosures(), demoEmail(), hoursFromNow(), RELEASE_NOTES, seedDemoUsers()

### Community 196 - "Community 196"
Cohesion: 0.39
Nodes (6): app.enforce_quota(), app.quota_limit(), buildings_quota, floors_quota, info_points_quota, venues_quota

### Community 197 - "Community 197"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 198 - "Community 198"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 199 - "Community 199"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 200 - "Community 200"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 202 - "Community 202"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 203 - "Community 203"
Cohesion: 0.29
Nodes (7): rest, condition, storage, depends_on, image, restart, volumes

### Community 204 - "Community 204"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 205 - "Community 205"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 206 - "Community 206"
Cohesion: 0.43
Nodes (4): vendor.checkins, vendor.clients, vendor.installations, vendor.licenses

### Community 207 - "Community 207"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 208 - "Community 208"
Cohesion: 0.40
Nodes (3): base64UrlDecode(), PUBLIC_FUNCTIONS, validJwt()

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
Nodes (5): compilerOptions, lib, types, extends, include

### Community 213 - "Community 213"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 214 - "Community 214"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 215 - "Community 215"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 216 - "Community 216"
Cohesion: 0.33
Nodes (5): vulnerabilities, expired_at, id, purls, statement

### Community 217 - "Community 217"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 218 - "Community 218"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 219 - "Community 219"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

### Community 220 - "Community 220"
Cohesion: 0.40
Nodes (4): compilerOptions, types, extends, include

## Knowledge Gaps
- **5 isolated node(s):** `TARGETS`, `RFC-4180`, `RFC-6238`, `RFC-2045`, `RFC-2387`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2391 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 26` to `Community 0`, `Community 98`, `Community 5`, `Community 168`, `Community 15`, `Community 80`, `Community 83`, `Community 20`, `Community 22`, `Community 88`, `Community 25`, `Community 155`, `Community 31`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `TARGETS`, `RFC-4180`, `RFC-6238` to the rest of the system?**
  _5 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03450060376056581 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 5` to `Community 0`, `Community 1`, `Community 4`, `Community 133`, `Community 9`, `Community 138`, `Community 13`, `Community 15`, `Community 18`, `Community 22`, `Community 26`, `Community 31`, `Community 32`, `Community 42`, `Community 53`, `Community 58`, `Community 67`, `Community 68`, `Community 70`, `Community 71`, `Community 72`, `Community 83`, `Community 100`, `Community 103`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.036163522012578615 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 12` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 14`, `Community 15`, `Community 18`, `Community 21`, `Community 22`, `Community 23`, `Community 28`, `Community 163`, `Community 36`, `Community 37`, `Community 166`, `Community 41`, `Community 44`, `Community 45`, `Community 53`, `Community 54`, `Community 58`, `Community 62`, `Community 194`, `Community 67`, `Community 68`, `Community 195`, `Community 71`, `Community 77`, `Community 90`, `Community 95`, `Community 100`, `Community 101`, `Community 105`, `Community 119`, `Community 123`, `Community 127`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.031446540880503145 - nodes in this community are weakly interconnected._