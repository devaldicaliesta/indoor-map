# Graph Report - indoor-map  (2026-11-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 10082 nodes · 32570 edges · 318 communities (241 shown, 77 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 507 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `759220a1`
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
- Community 257
- Community 258
- Community 259
- Community 260
- Community 261
- Community 262
- Community 263
- Community 265
- Community 279

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
- `Attempt` --references--> `DataClient`  [EXTRACTED]
  e2e/support/role-attempts.ts → packages/data/src/client.ts
- `DemoRouteOptions` --references--> `Snapshot`  [EXTRACTED]
  apps/landing/src/demo/use-demo-route.ts → packages/domain/src/snapshot.ts
- `ClosureMarkData` --references--> `SnapshotPosition`  [EXTRACTED]
  apps/visitor/src/features/closures/closure-model.ts → packages/domain/src/snapshot.ts
- `FloorTarget` --references--> `BuildingId`  [EXTRACTED]
  apps/admin/src/features/venues/floors/queries.ts → packages/domain/src/ids.ts
- `choose()` --indirect_call--> `locations()`  [INFERRED]
  apps/admin/src/features/import/import-dialog.tsx → tests/perf/src/large-venue.ts

## Import Cycles
- None detected.

## Communities (318 total, 77 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (181): ConnectorDialogState, useConnectorDialog, CONNECTOR_KIND_LABELS, ConnectorDetails(), ConnectorPanel(), DIRECTION_LABELS, stopNames(), connectorsKey() (+173 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (149): Field(), others, TimezoneSelect(), VenuePicker(), ROLE_LABELS, AREA_KINDS, targetKey(), TargetPicker() (+141 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (124): submit(), haversineM(), SnapshotConnectorKind, SnapshotGraph, SnapshotPosition, ARC_ACCESSIBLE, ARC_CONNECTOR, ArcDraft (+116 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (101): createRepositories(), CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, TablesInsert (+93 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (138): useCan(), inVenueTime(), HomeRedirect(), INSTALLATION_MODULES, ModulePage(), ModuleRoute(), PlaceholderPage(), NotFoundPage() (+130 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (37): FOOTPRINT, linkUnitsToPath(), test, TEST_CENTER, unitSquare(), AdminShell, EditorPage, EditorTool (+29 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (128): currentProfileKey, useAuthSync(), useCurrentProfile(), RequireAuth(), initialAuthRedirectHash, AppLayout(), NarrowScreenNotice(), subscribe() (+120 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (126): Choice(), fileSlug(), saveBlob(), useVenueSelection, venuesKey, FormNotice(), ForgotPasswordPage(), floorLabel() (+118 more)

### Community 8 - "Community 8"
Cohesion: 0.04
Nodes (121): Can(), GRACE_READ_ONLY_HINT, useLicenseReadOnly(), useRole(), AdminTourButton(), LABELS, seenKey, useAdminTour() (+113 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (96): BrandGallery(), COLUMNS, DataTableGallery(), date, DEMO_STATES, DemoState, FILTERS, FLOORS (+88 more)

### Community 10 - "Community 10"
Cohesion: 0.04
Nodes (47): RFC-6238, env, envFile, createHostedTrial(), endHostedTrial(), HostedTrialUser, removeHostedTrial(), currentLicenseId() (+39 more)

### Community 11 - "Community 11"
Cohesion: 0.04
Nodes (113): InsertedVenue, english(), locationDescription(), LocationPlace, Place, SnapshotIndex, hasOpeningHours(), hhmm() (+105 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (71): envFile, VENUES, SnapshotPolygon, CONTEXT, VENUES, ADDRESS, Collection, VENUES (+63 more)

### Community 13 - "Community 13"
Cohesion: 0.04
Nodes (85): createAuthRepository(), signOut(), toDataError(), fromFunctionError(), FUNCTION_KINDS, fetchAllPages(), listPage(), PAGE_SIZE (+77 more)

### Community 14 - "Community 14"
Cohesion: 0.02
Nodes (61): NON_RETRYABLE, queryClient, DataClientConfig, Page, PageQuery, AnalyticsConfig, AnalyticsRepository, createAnalyticsRepository() (+53 more)

### Community 15 - "Community 15"
Cohesion: 0.03
Nodes (41): VenueSelection, VenueBasics, DataClient, AliasesRepository, BuildingsRepository, ClosuresRepository, ConnectorsRepository, DisplaySettingsRepository (+33 more)

### Community 16 - "Community 16"
Cohesion: 0.05
Nodes (90): data, all, buildings, floorFeatures(), floors, MapPreview(), showFloor(), MapPreviewPage() (+82 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (85): iconSpecs(), BottomSheet(), onClick(), onKeyDown(), onPointerDown(), onPointerMove(), onPointerUp(), cycleSnap() (+77 more)

### Community 18 - "Community 18"
Cohesion: 0.04
Nodes (79): facility, index, snapshot, RouteFailure, routeFailure(), routeFloors(), stepTexts(), targetOfPlace() (+71 more)

### Community 19 - "Community 19"
Cohesion: 0.05
Nodes (78): licenseFileName(), HOSTED_TRIAL_DAYS, accepted(), claim(), logError(), NoticeRow, release(), text() (+70 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (86): loadCrowd(), crowdAreas(), useCrowdMap(), SnapshotNodeRole, areaSpots(), arrive(), between(), blankPerson() (+78 more)

### Community 21 - "Community 21"
Cohesion: 0.03
Nodes (64): app.log_event(), audit_events_occurred_idx, public.audit_events, public.profiles, public.system_settings, app.guard_last_super_admin(), app.log_profile_changes(), profiles_guard_last_super_admin (+56 more)

### Community 22 - "Community 22"
Cohesion: 0.03
Nodes (66): page, diagnoseWriteRejection(), sql(), json(), read(), results, root, DESKTOP (+58 more)

### Community 23 - "Community 23"
Cohesion: 0.03
Nodes (62): EMPTY, PublishedVenue, TestVenue, globalSetup(), Attempt, RoleTargets, SERVER_ATTEMPTS, SQUARE (+54 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (76): MapFeatureProperties, DEFAULT_FILL, DEFAULT_HEIGHTS, DEFAULT_OUTLINE, MAP_BACKGROUND, OUTDOOR_SUBTYPE_FILL, PITCH_3D, POINT_COLOR (+68 more)

### Community 25 - "Community 25"
Cohesion: 0.04
Nodes (62): CODE_RULES, CodeRule, DataErrorKind, DEFAULT_MESSAGES, HTTP_RULES, isNetworkFailure(), readHttpStatus(), readString() (+54 more)

### Community 26 - "Community 26"
Cohesion: 0.08
Nodes (70): EntityIcon(), ListRow(), FacilityDetail(), Missing(), UnitDetail(), FieldValue(), LocationProfile(), Places() (+62 more)

### Community 27 - "Community 27"
Cohesion: 0.03
Nodes (64): Draft, Json, CategoriesRepository, BulkEditRow, createLocationBulkEditsRepository(), get(), LocationBulkEditsRepository, mapBulkEditRow() (+56 more)

### Community 28 - "Community 28"
Cohesion: 0.05
Nodes (77): FeatureFieldset(), FormProblem(), fromQuotaDraft(), QUOTA_FIELDS, QuotaDraft, QuotaFieldset(), QuotaKey, REQUIRED (+69 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (57): app.on_venue_created(), public.buildings, public.display_settings, public.floors, public.info_points, public.instruction_templates, public.origin_points, public.venues (+49 more)

### Community 30 - "Community 30"
Cohesion: 0.04
Nodes (50): Geometry, COORDINATE_DECIMALS, createFeatureEditor(), onClick(), drawStyles(), EditableFeature, editableFlags(), FeatureEditor (+42 more)

### Community 31 - "Community 31"
Cohesion: 0.07
Nodes (59): PanelMessage(), useMediaQuery(), Brand(), DESKTOP_QUERY, Logo(), MapArea(), MOBILE_HEADER_PX, VisitorShell() (+51 more)

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (18): VisitorPage, createVariedVenues(), specs(), pdfText(), download(), evidence(), pdfText(), shot() (+10 more)

### Community 33 - "Community 33"
Cohesion: 0.05
Nodes (52): capitalize(), closureText(), connectorNames(), FailedPlan, FailureContext, FailureText, failureText(), floorGap() (+44 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (40): ACCOUNTS, LoginPage, InvitedUser, inviteUser(), Mail, MailpitDetail, MailpitSummary, search() (+32 more)

### Community 35 - "Community 35"
Cohesion: 0.06
Nodes (63): submit(), download(), boardsPdf(), floorFeatures(), KIND_LABELS_EN, languageOf(), locationStickerUrl(), mainLocations() (+55 more)

### Community 36 - "Community 36"
Cohesion: 0.05
Nodes (62): canonicalize(), fromBase64(), isCount(), isDate(), VendorLicense, isText(), Json, VendorLicenseKey (+54 more)

### Community 37 - "Community 37"
Cohesion: 0.05
Nodes (50): ACCOUNT_INACTIVE_MESSAGE, AUTH_EVENTS, authError(), AuthErrorCode, AuthErrorLike, AuthEvent, EMAIL_UNAVAILABLE_PREFIXES, toAuthError() (+42 more)

### Community 38 - "Community 38"
Cohesion: 0.07
Nodes (43): app.check_unit_single_location(), app.release_units_on_permanent_close(), location_units_single_location, locations_release_units, public.categories, public.facility_types, public.features, public.field_definitions (+35 more)

### Community 39 - "Community 39"
Cohesion: 0.06
Nodes (57): BasemapUrlProblem, checkBasemapTileUrl(), escapeAttribution(), LOCAL_HOSTS, ParsedUrl, applyEntitlements(), enabledFeatures(), FEATURE_LABELS (+49 more)

### Community 40 - "Community 40"
Cohesion: 0.06
Nodes (52): FOCUS_MIN_ZOOM, focusFeature(), focusZoom(), geometryBounds(), getCamera(), prefersReducedMotion(), Corners, attributed (+44 more)

### Community 41 - "Community 41"
Cohesion: 0.05
Nodes (50): ACTION_ICONS, InstructionErrors, previewInstruction(), SAMPLE, SAMPLE_FLOOR, validateInstruction(), placeholders(), polygonAreaM2() (+42 more)

### Community 42 - "Community 42"
Cohesion: 0.05
Nodes (54): BPM, Copy, COPY, EN, ID, SCENES, assets, drawScene() (+46 more)

### Community 43 - "Community 43"
Cohesion: 0.05
Nodes (37): SheetSnap, targetOfPick(), useExploreMap(), createExploreStore(), ExploreList, ExploreState, FocusMode, INITIAL (+29 more)

### Community 44 - "Community 44"
Cohesion: 0.06
Nodes (34): Fixtures, appServers, args, CI, projectArgs, capture(), shot(), base() (+26 more)

### Community 45 - "Community 45"
Cohesion: 0.04
Nodes (38): public.installation, public.licenses, app.license_active(), public.license_install(), public.license_status(), app.clock_rolled_back(), app.license_active(), app.license_tick() (+30 more)

### Community 46 - "Community 46"
Cohesion: 0.04
Nodes (61): devDependencies, @biomejs/biome@catalog:, @indoor/third-party-notices@workspace:*, tailwindcss@catalog:, @tailwindcss/vite@catalog:, @types/node@catalog:, @types/react-dom@catalog:, typescript@catalog: (+53 more)

### Community 47 - "Community 47"
Cohesion: 0.05
Nodes (49): expected(), mapCategoryRow(), customFieldsOf(), FloorEmbed, hoursToRows(), IMAGE_EXTENSIONS, IMPORT_BATCH, LocationPageFilters (+41 more)

### Community 48 - "Community 48"
Cohesion: 0.09
Nodes (53): Calibration(), GeoreferencePanel(), resize(), meters, NumberField(), commit(), parseDecimal(), FALLBACK_CENTER (+45 more)

### Community 49 - "Community 49"
Cohesion: 0.09
Nodes (50): pendingAfterRender(), readFilter(), readTableState(), TableUrlOptions, FILTERS, OPTIONS, read(), validDate() (+42 more)

### Community 50 - "Community 50"
Cohesion: 0.07
Nodes (52): BUILDING_SIZES, BUILDING_TYPES, CSV_LABELS, date, dateTime, REJECT_REASONS, STAGES, BlocklistPanel() (+44 more)

### Community 51 - "Community 51"
Cohesion: 0.05
Nodes (35): BlockEntry, createVendorClientsRepository(), functionError(), Functions, LicenseRow, NewVendorClient, NewVendorInstallation, readLicenseFile() (+27 more)

### Community 52 - "Community 52"
Cohesion: 0.04
Nodes (55): @biomejs/biome, @types/node, typescript, bin, license-cli, devDependencies, @biomejs/biome@catalog:, @types/node@catalog: (+47 more)

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (37): public.hosting_queue_next(), hosting.vendor_actions, public.vendor_clients(), public.vendor_installations(), vendor.checkins, vendor.clients, vendor.installations, vendor.licenses (+29 more)

### Community 54 - "Community 54"
Cohesion: 0.06
Nodes (40): candidateLabels(), CandidateList(), KIND_LABELS, Results(), ScanPanel(), useActivePlan(), useScan(), ScanState (+32 more)

### Community 55 - "Community 55"
Cohesion: 0.07
Nodes (40): app.api_key_check(), app.api_spans(), app.check_venue_list(), app.check_webhook_input(), app.webhook_emit(), app.webhook_flush(), app.webhook_location_touched(), app.webhook_on_location() (+32 more)

### Community 56 - "Community 56"
Cohesion: 0.06
Nodes (43): svgToPng(), usePickedFile(), pick(), renderPdfPage(), selectPage(), loadPdfJs(), openPdf(), PdfDocument (+35 more)

### Community 57 - "Community 57"
Cohesion: 0.06
Nodes (38): hosting.trials, app.can_write_floor(), app.can_write_location(), app.can_write_location_type(), app.reject_locked_venue(), app.venue_locked(), app.writable_venue_ids(), edit_locks_trial_lock (+30 more)

### Community 58 - "Community 58"
Cohesion: 0.09
Nodes (45): CLOSE_BUTTON, OPTION_LIFT_A, SAVE_BUTTON, SELECT_BOX, EDITOR_CAM, PUBLISH_BUTTON, unitCorner(), VALIDATE_BUTTON (+37 more)

### Community 59 - "Community 59"
Cohesion: 0.06
Nodes (45): API_SCOPE_LABELS, API_SCOPES, API_UPSERT_MAX, ApiClosureInput, ApiHoursRow, ApiLocationUpsert, ApiParse, ApiScope (+37 more)

### Community 60 - "Community 60"
Cohesion: 0.05
Nodes (49): lucide-react@catalog:, @types/react@catalog:, lucide-react, @types/react, @types/react@catalog:, @types/react@catalog:, lucide-react@catalog:, @types/react@catalog: (+41 more)

### Community 61 - "Community 61"
Cohesion: 0.09
Nodes (40): ColorField(), isColorValue(), aliasesKey(), AliasField(), PROBLEM_MESSAGES, useAliasDraft(), FacilityTypeDialog(), submit() (+32 more)

### Community 62 - "Community 62"
Cohesion: 0.07
Nodes (39): Block(), BLOCKS, EulaConsent(), LegalBlock, legalTextVersion(), parseLegalText(), COMMON_WORDS, contextWords() (+31 more)

### Community 63 - "Community 63"
Cohesion: 0.08
Nodes (38): SearchField(), PrivacyNotice(), PrivacyToggle(), ANALYTICS_FLUSH_MS, ANALYTICS_FLUSH_SIZE, AnalyticsQueue, choice, choosePrivacy() (+30 more)

### Community 64 - "Community 64"
Cohesion: 0.06
Nodes (38): createMediaRepository(), list(), IMAGE_EXTENSIONS, isBucket(), mapMediaRow(), MediaRepository, MediaRow, usagesOf() (+30 more)

### Community 65 - "Community 65"
Cohesion: 0.06
Nodes (34): Georeferencer, LngLat, GraphInteractionOptions, GraphNodeDrag, GraphEdgeView, GraphNodeView, GraphSuggestionView, ahead() (+26 more)

### Community 66 - "Community 66"
Cohesion: 0.08
Nodes (36): createGraphInteractions(), onMove(), onUp(), preview(), snapped(), EMPTY, graphCollection(), graphElementAt() (+28 more)

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (41): BulkUndoBanner(), count, LocationSelection, SelectCheckbox(), SelectionBar(), useLocationSelection(), buildingNames(), floorNames() (+33 more)

### Community 68 - "Community 68"
Cohesion: 0.10
Nodes (35): data, EventDetail(), EventList(), EventRow(), KindBadge(), LiveBadge(), LocationEvents(), Section() (+27 more)

### Community 69 - "Community 69"
Cohesion: 0.06
Nodes (39): featurePosition(), endPlace(), endTarget(), featureAt(), placeEnd(), SharedState, sharedState(), shareLink() (+31 more)

### Community 70 - "Community 70"
Cohesion: 0.11
Nodes (39): signedLicense(), paidLicense(), newLicenseId(), licenseSigningBytes(), toBase64(), onPremTrialIssueRequest(), trialApprovalDaysProblem(), sign() (+31 more)

### Community 71 - "Community 71"
Cohesion: 0.06
Nodes (42): IMDF_ACCESS_CONTROL, IMDF_ACCESSIBILITY, IMDF_AMENITY_CATEGORIES, IMDF_BUILDING_CATEGORIES, IMDF_FOOTPRINT_CATEGORIES, IMDF_LEVEL_CATEGORIES, IMDF_OCCUPANT_CATEGORIES, IMDF_OPENING_CATEGORIES (+34 more)

### Community 72 - "Community 72"
Cohesion: 0.06
Nodes (36): app.check_edge_same_floor(), app.touch_updated_at(), app.user_role(), closures_venue_period_idx, display_settings_touch_updated_at, features_floor_idx, features_geom_idx, features_unit_code_unique (+28 more)

### Community 73 - "Community 73"
Cohesion: 0.17
Nodes (39): ContrastTable(), PreviewTable(), BackupHistory(), formatDate(), formatDateTime(), History(), ClientsPanel(), ClientsTable() (+31 more)

### Community 74 - "Community 74"
Cohesion: 0.09
Nodes (41): emptyInput(), changeRepeat(), inputOf(), eventImageUrl(), EVENTS_REFRESH_MS, EventSave, eventsKey(), useEventMutations() (+33 more)

### Community 75 - "Community 75"
Cohesion: 0.08
Nodes (30): createDeviceTourStore(), deviceTourStore, SEEN_STORAGE_KEY, useVisitorTour(), infoPointTour(), ShowSheet, venueTour(), useExplorerTour() (+22 more)

### Community 76 - "Community 76"
Cohesion: 0.06
Nodes (27): public.edit_locks, public.publications, publications_one_active, public.publish_abort(), public.publish_begin(), public.publish_commit(), app.floor_writable(), public.acquire_edit_lock() (+19 more)

### Community 77 - "Community 77"
Cohesion: 0.05
Nodes (43): catalog, @axe-core/playwright, @biomejs/biome, class-variance-authority, clsx, driver.js, i18next, lucide-react (+35 more)

### Community 78 - "Community 78"
Cohesion: 0.05
Nodes (42): source, assist, actions, enabled, css, parser, files, ignoreUnknown (+34 more)

### Community 79 - "Community 79"
Cohesion: 0.12
Nodes (37): SnapshotNavNode, IssueSeverity, geometryFindings(), instructionFindings(), isEmptyValue(), locationFindings(), planFindings(), byFloor() (+29 more)

### Community 80 - "Community 80"
Cohesion: 0.08
Nodes (35): DEMO_URL, OUTCOMES, pending, RequestResult, requestTrial(), visitorUrl, en, id (+27 more)

### Community 81 - "Community 81"
Cohesion: 0.10
Nodes (35): RouteGraphStatus, nearestTarget(), ExploreContext, ExploreData, ExploreProvider(), loadSearch(), NO_STOPS, routeCache() (+27 more)

### Community 82 - "Community 82"
Cohesion: 0.08
Nodes (16): DataTablePage, drawPlan(), multiPagePdf(), openGallery(), capture(), shot(), checkTable(), IMPORT_HEADER (+8 more)

### Community 83 - "Community 83"
Cohesion: 0.11
Nodes (33): copy(), Certificate(), Disks(), LastBackup(), Row(), Services(), alertText(), date (+25 more)

### Community 84 - "Community 84"
Cohesion: 0.06
Nodes (16): AuthRepository, MfaRepository, ProfilesRepository, UsersRepository, Db, DEMO_USERS, demoClosures(), demoEmail() (+8 more)

### Community 85 - "Community 85"
Cohesion: 0.06
Nodes (38): @indoor/map-core@workspace:*, react-router@catalog:, @indoor/map-core, react-router, @indoor/map-core@workspace:*, dependencies, i18next@catalog:, @indoor/domain@workspace:* (+30 more)

### Community 86 - "Community 86"
Cohesion: 0.09
Nodes (33): ConnectorFormBody(), submit(), changeKind(), CONNECTOR_PROBLEM_MESSAGES, ConnectorForm, defaultName(), formDraft(), formFloorIds() (+25 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (35): checkGlb(), checkModelPlacement(), GLB_MIME, GLB_PROBLEM_MESSAGES, GlbProblem, inRange(), latin1(), LibraryModel (+27 more)

### Community 88 - "Community 88"
Cohesion: 0.06
Nodes (35): autoStills(), frozenRuns(), audio, build, { chromium }, clips, decode(), encoded (+27 more)

### Community 89 - "Community 89"
Cohesion: 0.11
Nodes (31): DemoOrigin, demoOrigin(), demoRoute(), destinationGroups(), routeFloorIds(), routeViewOn(), shownFloorOf(), stepTexts() (+23 more)

### Community 90 - "Community 90"
Cohesion: 0.08
Nodes (21): app.hook_password_verification_attempt(), app.log_settings_changed(), public.set_smtp_password(), public.smtp_password_for_sending(), public.smtp_password_is_set(), system_settings_log_changes, app.hook_password_verification_attempt(), app.request_account_notice() (+13 more)

### Community 91 - "Community 91"
Cohesion: 0.06
Nodes (36): defaults, name, runs-on, steps, timeout-minutes, runs-on, steps, timeout-minutes (+28 more)

### Community 92 - "Community 92"
Cohesion: 0.06
Nodes (36): concurrency, cancel-in-progress, group, name, runs-on, steps, name, runs-on (+28 more)

### Community 93 - "Community 93"
Cohesion: 0.09
Nodes (32): areaFormat, Boundary, BOUNDARY_TOLERANCE_M, Checked, checkPolygon(), duplicateCodeIssues(), GEOMETRY_ISSUE_CODES, GeometryIssueCode (+24 more)

### Community 94 - "Community 94"
Cohesion: 0.21
Nodes (34): ClosureState, DIALOG, dialog(), drawClosures(), table(), drawEditor(), featurePanel(), propertiesPanel() (+26 more)

### Community 95 - "Community 95"
Cohesion: 0.09
Nodes (17): ContrastFailure, contrastFailures(), CheckResult, escapeHtml(), readJson(), readRepo(), renderSummary(), repoRoot (+9 more)

### Community 96 - "Community 96"
Cohesion: 0.11
Nodes (29): DisplayFormErrors, DisplayFormValues, HEIGHT_MESSAGES, number, settings, toPatch(), validate(), submit() (+21 more)

### Community 97 - "Community 97"
Cohesion: 0.10
Nodes (26): BASEMAP_MESSAGES, orNull(), SystemFormErrors, SystemFormValues, SystemTextField, base, toPatch(), URL_MESSAGES (+18 more)

### Community 98 - "Community 98"
Cohesion: 0.07
Nodes (32): devDependencies, @biomejs/biome@catalog:, supabase@catalog:, turbo@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog:, engines (+24 more)

### Community 99 - "Community 99"
Cohesion: 0.18
Nodes (25): isPolygonal(), builtinIcon(), writeOccupants(), writeOpening(), writePoints(), snapshotToImdf(), writeBuildings(), writeLevels() (+17 more)

### Community 100 - "Community 100"
Cohesion: 0.09
Nodes (26): ExportResult, collection(), ExportFeature, ExportFeatureCollection, ExportGeometry, GEOJSON_EXPORT_FORMAT, GEOJSON_EXPORT_VERSION, graphFeatures() (+18 more)

### Community 101 - "Community 101"
Cohesion: 0.16
Nodes (23): TemplatePreview(), VenueSpec, airportStation, campus, custom, factoryWarehouse, hospital, hours (+15 more)

### Community 102 - "Community 102"
Cohesion: 0.15
Nodes (30): canvasArea(), connectorColor(), drawPlan(), strokeRoute(), deskAndMonitor(), LOBBY, lobby(), screenQuad() (+22 more)

### Community 103 - "Community 103"
Cohesion: 0.15
Nodes (27): count, fallbackLabel(), FeatureList(), onSearchKey(), GroupRow(), ItemRow(), buildRows(), collator (+19 more)

### Community 104 - "Community 104"
Cohesion: 0.11
Nodes (14): Entry, GraphChangesInput, GraphSaveQueue, GraphSaveQueueOptions, deferred(), setup(), venue, toChanges() (+6 more)

### Community 105 - "Community 105"
Cohesion: 0.10
Nodes (27): box(), C, canvas, caption(), clamp(), ctx, drawLogo(), DURATION_MS (+19 more)

### Community 106 - "Community 106"
Cohesion: 0.15
Nodes (22): App(), Gate, gateKey, readGate(), AuthShell(), errorText(), FormNotice(), LoginForm() (+14 more)

### Community 107 - "Community 107"
Cohesion: 0.08
Nodes (18): NON_RETRYABLE, queryClient, LanguagePicker(), applyVenueLanguage(), initial, readStoredLanguage(), setLanguage(), rootElement (+10 more)

### Community 108 - "Community 108"
Cohesion: 0.17
Nodes (28): attachAt(), clamp01(), closestBetween(), firstPosition(), inside(), LinkTargets, linkTargets(), nearestOnGraph() (+20 more)

### Community 109 - "Community 109"
Cohesion: 0.12
Nodes (27): MapLabel, hasLocationIcon, kind, LABEL_LAYER_ID, LABEL_SOURCE_ID, labelCollection(), setLabels(), canvas2d() (+19 more)

### Community 110 - "Community 110"
Cohesion: 0.06
Nodes (30): fixture_audit_events, fixture_buildings, fixture_categories, fixture_closures, fixture_connector_stops, fixture_connectors, fixture_display_settings, fixture_edit_locks (+22 more)

### Community 111 - "Community 111"
Cohesion: 0.07
Nodes (30): environment, API_EXTERNAL_URL, GOTRUE_API_HOST, GOTRUE_API_PORT, GOTRUE_DB_DATABASE_URL, GOTRUE_DB_DRIVER, GOTRUE_DISABLE_SIGNUP, GOTRUE_EXTERNAL_EMAIL_ENABLED (+22 more)

### Community 112 - "Community 112"
Cohesion: 0.13
Nodes (23): RFC-2045, RFC-2387, addressOf(), Attachment, attachmentPart(), base64(), base64Lines(), bodyPart() (+15 more)

### Community 113 - "Community 113"
Cohesion: 0.13
Nodes (27): TRIAL_FEATURES, TRIAL_MIN_DAYS, checkOnPremTrialRequest(), ONPREM_TRIAL_DEFAULT_DAYS, ONPREM_TRIAL_STATUSES, OnPremTrialCheck, onPremTrialRefusal(), OnPremTrialRequest (+19 more)

### Community 114 - "Community 114"
Cohesion: 0.12
Nodes (23): parseModelRef(), three@catalog:, createModelsLayer(), rebuild(), report(), placeModels(), libraryModel(), loadThreeLayer() (+15 more)

### Community 115 - "Community 115"
Cohesion: 0.08
Nodes (25): connector(), connectors, edge(), edges, escalatorDown, escalatorUp, gtColumns, gtDoor (+17 more)

### Community 116 - "Community 116"
Cohesion: 0.08
Nodes (28): @indoor/ui@workspace:*, @tanstack/react-query@catalog:, @indoor/ui, @tanstack/react-query, @indoor/ui@workspace:*, dependencies, @indoor/data@workspace:*, @indoor/domain@workspace:* (+20 more)

### Community 117 - "Community 117"
Cohesion: 0.13
Nodes (25): EditorState, TOOLS, Connector, CONNECTORS, CORRIDORS, DESTINATION, DESTINATION_UNIT, FLOOR_D (+17 more)

### Community 118 - "Community 118"
Cohesion: 0.15
Nodes (23): home(), LanguageSwitch(), MobileMenu(), privacyPage(), SiteFooter(), SiteHeader(), useDocumentMeta(), PAGES (+15 more)

### Community 119 - "Community 119"
Cohesion: 0.08
Nodes (27): dependencies, fflate@^0.8.3, @indoor/domain@workspace:*, react@catalog:, react-dom@catalog:, zod@catalog:, zustand@catalog:, fflate (+19 more)

### Community 120 - "Community 120"
Cohesion: 0.08
Nodes (27): @indoor/data@workspace:*, pdfjs-dist@catalog:, @indoor/data@workspace:*, devDependencies, @biomejs/biome@catalog:, fflate@^0.8.3, @indoor/data@workspace:*, @indoor/domain@workspace:* (+19 more)

### Community 121 - "Community 121"
Cohesion: 0.19
Nodes (21): LandingPage(), useLanguage(), Contact(), BUILDING_ICONS, Buildings(), FEATURE_ICONS, Features(), Hero() (+13 more)

### Community 122 - "Community 122"
Cohesion: 0.08
Nodes (27): dependencies, @indoor/domain@workspace:*, @supabase/supabase-js@catalog:, devDependencies, @biomejs/biome@catalog:, @types/node@catalog:, typescript@catalog:, vitest@catalog: (+19 more)

### Community 123 - "Community 123"
Cohesion: 0.08
Nodes (27): dependencies, zod@catalog:, devDependencies, @biomejs/biome@catalog:, typescript@catalog:, vitest@catalog:, exports, ./export (+19 more)

### Community 124 - "Community 124"
Cohesion: 0.13
Nodes (7): ConversionError, _extents(), inspect_dxf(), Inspection, is_dwg(), _read(), InspectTest

### Community 125 - "Community 125"
Cohesion: 0.24
Nodes (18): axis_walls(), close_doors(), Deadline, decode(), diagonal_walls(), drop_small(), find_rooms(), find_walls() (+10 more)

### Community 126 - "Community 126"
Cohesion: 0.10
Nodes (25): ANALYTICS_DEVICES, ANALYTICS_ORIGIN_KINDS, ANALYTICS_QUERY_MAX, ANALYTICS_RETENTION_DAYS, ANALYTICS_SOURCES, ANALYTICS_TARGET_KINDS, AnalyticsContext, analyticsDays() (+17 more)

### Community 127 - "Community 127"
Cohesion: 0.09
Nodes (25): @indoor/routing@workspace:*, @indoor/routing, @indoor/routing@workspace:*, @indoor/routing@workspace:*, @axe-core/playwright, devDependencies, @axe-core/playwright@catalog:, @biomejs/biome@catalog: (+17 more)

### Community 128 - "Community 128"
Cohesion: 0.21
Nodes (15): currentGraph(), GraphActions, useGraphActions(), addEntrance(), applyEntrances(), linkEntrance(), removeEntrancesOf(), Draft (+7 more)

### Community 129 - "Community 129"
Cohesion: 0.13
Nodes (21): cert_json(), clean(), disk_json(), disks_json(), services_json(), health-report.sh script, ask(), assert_env_version() (+13 more)

### Community 130 - "Community 130"
Cohesion: 0.14
Nodes (15): alignmentPositions(), BLOCKS, dataBytes(), dataCodewords(), divisor(), ECC_PER_BLOCK, encodeQr(), Grid (+7 more)

### Community 131 - "Community 131"
Cohesion: 0.19
Nodes (23): roomGeometry(), Box, boxesOverlap(), boxOf(), clipConvex(), cross(), dot(), findEar() (+15 more)

### Community 132 - "Community 132"
Cohesion: 0.14
Nodes (21): BuildingType, slugFromName(), TRIAL_SAMPLE_LIMITS, TRIAL_TEMPLATES, trialSample(), TrialSampleLimits, hoursRows(), point() (+13 more)

### Community 133 - "Community 133"
Cohesion: 0.17
Nodes (22): at(), CATEGORY_ID, DENSE_FLOOR, FACILITY_TYPE_ID, floorFeatures(), FloorGraph, floorGraph(), floorName() (+14 more)

### Community 134 - "Community 134"
Cohesion: 0.15
Nodes (19): downloadCsvTemplate(), downloadXlsxTemplate(), save(), slug(), columnIndex(), columnName(), escapeXml(), firstSheetPath() (+11 more)

### Community 135 - "Community 135"
Cohesion: 0.09
Nodes (24): dependencies, @indoor/domain@workspace:*, lucide-react@catalog:, react@catalog:, react-dom@catalog:, react, @indoor/domain, dependencies (+16 more)

### Community 136 - "Community 136"
Cohesion: 0.13
Nodes (20): FIELD_PROBLEM_MESSAGES, FIELD_TYPE_LABELS, useTypeChoice(), change(), lostOnChange(), CustomField, customFieldInput(), CustomFieldProblem (+12 more)

### Community 137 - "Community 137"
Cohesion: 0.17
Nodes (18): colorNotes(), channel(), contrastRatio(), parseHex(), readableTextOn(), relativeLuminance(), WCAG_AA_TEXT, WCAG_AA_UI (+10 more)

### Community 138 - "Community 138"
Cohesion: 0.17
Nodes (20): BrandingPanel(), LogoDraft, LogoChange, useSaveBranding(), useVenueDetail(), venueKey(), toFormValues(), cameraSummary() (+12 more)

### Community 139 - "Community 139"
Cohesion: 0.15
Nodes (21): buildingCam(), buildingMarkers(), BuildingOpts, buildingRoute(), drawBuilding(), FLOOR_GAP, FLOORS, floorZ() (+13 more)

### Community 140 - "Community 140"
Cohesion: 0.08
Nodes (23): concurrency, cancel-in-progress, group, GH_TOKEN, jobs, release, name, on (+15 more)

### Community 141 - "Community 141"
Cohesion: 0.25
Nodes (19): along(), anchored(), cross(), crossing(), EMPTY_PATCH, GraphChange, lerp(), nearestNode() (+11 more)

### Community 142 - "Community 142"
Cohesion: 0.09
Nodes (16): OriginPointDraft, EntranceSuggestion, LinearRingSchema, LineStringSchema, MultiPolygon, MultiPolygonSchema, PointSchema, PolygonCoordinatesSchema (+8 more)

### Community 143 - "Community 143"
Cohesion: 0.12
Nodes (5): main(), supabase_access_check(), call(), check(), AccessCheckTest

### Community 144 - "Community 144"
Cohesion: 0.10
Nodes (22): @types/geojson@catalog:, @types/geojson, devDependencies, @biomejs/biome@catalog:, @types/geojson@catalog:, @types/three@catalog:, typescript@catalog:, vitest@catalog: (+14 more)

### Community 145 - "Community 145"
Cohesion: 0.18
Nodes (19): OUTDOOR, ActiveVersion(), kilobytes(), PublishButton(), VenuePublish(), activePublicationKey(), historyKey(), useActivePublication() (+11 more)

### Community 146 - "Community 146"
Cohesion: 0.09
Nodes (21): agentGuidance, dependsOn, outputs, cache, persistent, cache, $schema, tasks (+13 more)

### Community 147 - "Community 147"
Cohesion: 0.16
Nodes (19): Dashboard(), number, Range, RANGES, Ranked(), save(), SECTIONS, shiftDay() (+11 more)

### Community 148 - "Community 148"
Cohesion: 0.11
Nodes (5): EditorState, Direction, EditorTool, GraphElement, GraphVisibility

### Community 149 - "Community 149"
Cohesion: 0.10
Nodes (20): concurrency, cancel-in-progress, group, jobs, update, name, on, push (+12 more)

### Community 150 - "Community 150"
Cohesion: 0.15
Nodes (14): ActorRow, asRecord(), AuditFilters, AuditRepository, AuditRow, mapAuditRows(), toPerson(), actor (+6 more)

### Community 151 - "Community 151"
Cohesion: 0.13
Nodes (13): createFloorPlansRepository(), put(), venueOf(), FloorPlanRow, FloorPlansRepository, FloorPlanUpload, isCorners(), mapFloorPlanRow() (+5 more)

### Community 152 - "Community 152"
Cohesion: 0.13
Nodes (17): FIXTURE, generate(), subjectSetup(), target, USERS, VENUE, ACCESS_SUBJECTS, AccessSubject (+9 more)

### Community 153 - "Community 153"
Cohesion: 0.16
Nodes (7): bbox(), iou(), load(), matched(), png(), ScanFixtureTest, ScanLimitTest

### Community 154 - "Community 154"
Cohesion: 0.14
Nodes (16): ENTRIES, Entry, HAYSTACKS, info(), KEY_SET, PICTOGRAM_CATEGORIES, PICTOGRAM_CATEGORY_LABELS, PICTOGRAM_KEYS (+8 more)

### Community 155 - "Community 155"
Cohesion: 0.14
Nodes (13): BrandMarkProps, Part, SYMBOL_PARTS, LOGO_HEIGHT, LOGO_WIDTH, SYMBOL_BLUE, SYMBOL_WIDTH, SYMBOL_YELLOW (+5 more)

### Community 156 - "Community 156"
Cohesion: 0.18
Nodes (16): [product, nodeModules], authorOf(), collectNotices(), ExtraNotice, label(), licenseOf(), Notice, NOTICES_FILE (+8 more)

### Community 157 - "Community 157"
Cohesion: 0.17
Nodes (17): ChangeSummary(), count, GROUP_LABELS, GroupSection(), ItemList(), KIND_LABELS, byName(), CHANGE_GROUPS (+9 more)

### Community 158 - "Community 158"
Cohesion: 0.14
Nodes (12): ICONS, K, scene6, CATEGORY, closureHatch(), mix(), paperGrid(), paths (+4 more)

### Community 159 - "Community 159"
Cohesion: 0.19
Nodes (17): archive_package(), assemble_package(), assert_image_key(), build_images(), check_package(), collect_licenses(), copy_from_image(), export_source() (+9 more)

### Community 160 - "Community 160"
Cohesion: 0.18
Nodes (15): db_psql(), dc(), die(), fetch_images(), health_check(), health_once(), install_schedules(), load_env() (+7 more)

### Community 161 - "Community 161"
Cohesion: 0.22
Nodes (4): render_svg(), sample_dxf(), RenderTest, ServerTest

### Community 162 - "Community 162"
Cohesion: 0.20
Nodes (13): ActivePlan(), PlanPreview(), CadLayers(), meters, UNIT_LABELS, Picked, FloorPlanVersion, key() (+5 more)

### Community 163 - "Community 163"
Cohesion: 0.24
Nodes (15): downloadPdf(), downloadPng(), INSTRUCTIONS, qrFilename(), save(), A6_PT, contentStream(), fixed() (+7 more)

### Community 164 - "Community 164"
Cohesion: 0.11
Nodes (18): condition, auth, storage, ADMIN_URL, FUNCTIONS_URL, PGDATABASE, PGHOST, PGPASSWORD (+10 more)

### Community 165 - "Community 165"
Cohesion: 0.18
Nodes (13): ComponentSummary, ConnectorLinks, graphComponents(), isolatedNodeIds(), NO_OTHERS, smallestId(), summarizeComponents(), unionFind() (+5 more)

### Community 166 - "Community 166"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleDetection (+10 more)

### Community 167 - "Community 167"
Cohesion: 0.21
Nodes (12): Copy, COPY, en, id, Language, initialLanguage(), LanguageContext, LanguageProvider() (+4 more)

### Community 168 - "Community 168"
Cohesion: 0.12
Nodes (16): KEY, URL, jobs, ping, name, on, schedule, workflow_dispatch (+8 more)

### Community 169 - "Community 169"
Cohesion: 0.19
Nodes (15): applyGraphPatch(), edgeLengthM(), apply(), BASE, degree(), draw(), edgeList(), EMPTY (+7 more)

### Community 170 - "Community 170"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+8 more)

### Community 171 - "Community 171"
Cohesion: 0.20
Nodes (13): toDisplaySettingsUpdate(), row, BRANDING_KEYS, BrandingInput, brandingJson(), BrandingProblem, checkBranding(), isRecord() (+5 more)

### Community 172 - "Community 172"
Cohesion: 0.23
Nodes (10): areaM2(), Cell, cell(), CellQueue, centroidCell(), labelPoint(), segmentDistanceSq(), signedDistance() (+2 more)

### Community 173 - "Community 173"
Cohesion: 0.26
Nodes (5): SaveOp, SaveQueue, SaveQueueOptions, deferred(), setup()

### Community 174 - "Community 174"
Cohesion: 0.21
Nodes (12): VersionState(), checkCheckinRequest(), CheckinCheck, CheckinRequest, checkNewRelease(), InstallationReleaseState, installationReleaseState(), readSha256() (+4 more)

### Community 175 - "Community 175"
Cohesion: 0.25
Nodes (12): LicensePanel(), RevokeConfirm(), STATUS, todayInJakarta(), downloadLicense(), failed(), keys, useLicenseActions() (+4 more)

### Community 176 - "Community 176"
Cohesion: 0.17
Nodes (15): image, logging, restart, image, logging, restart, driver, options (+7 more)

### Community 177 - "Community 177"
Cohesion: 0.20
Nodes (5): medium(), save(), simple(), text_heavy(), wall()

### Community 178 - "Community 178"
Cohesion: 0.15
Nodes (10): dependencies, @indoor/domain@workspace:*, maplibre-gl@catalog:, terra-draw@catalog:, terra-draw-maplibre-gl-adapter@catalog:, EDIT_COLORS, createPolygonDrawer(), PolygonDrawer (+2 more)

### Community 179 - "Community 179"
Cohesion: 0.33
Nodes (14): addNoise(), addTone(), bass(), CHORDS, duckGain(), kick(), midi(), noiseSource() (+6 more)

### Community 180 - "Community 180"
Cohesion: 0.22
Nodes (9): ClosureMarkData, closureMarks(), knownClosures(), base, snapshot, useClosureMap(), CLOSURE_REFRESH_MS, closuresQuery() (+1 more)

### Community 181 - "Community 181"
Cohesion: 0.18
Nodes (10): changeFeatureKind(), DEFAULT_MODEL, nextUnitCode(), FEATURE_KINDS, INDOOR_KINDS, OUTDOOR_KINDS, OUTDOOR_SUBTYPES, OutdoorSubtype (+2 more)

### Community 182 - "Community 182"
Cohesion: 0.20
Nodes (11): ellipse(), here, lines, lucideRoot, num(), points(), rect(), require (+3 more)

### Community 183 - "Community 183"
Cohesion: 0.19
Nodes (10): API_COUNT_LABELS, AUDIT_LABELS, BULK_KINDS, describeAuditDetails(), describeDetails(), FAILURE_REASONS, LICENSE_SOURCES, roleLabel() (+2 more)

### Community 184 - "Community 184"
Cohesion: 0.24
Nodes (11): BrandingFormErrors, BrandingFormValues, ColorNote, livePreview(), MESSAGES, ratio, empty, toBrandingFormValues() (+3 more)

### Community 185 - "Community 185"
Cohesion: 0.15
Nodes (13): ADMIN_DOMAIN, API_DOMAIN, PANDUARAH_ANON_KEY, PANDUARAH_API_URL, TLS_DIRECTIVE, VISITOR_DOMAIN, web, depends_on (+5 more)

### Community 186 - "Community 186"
Cohesion: 0.15
Nodes (13): ANON_KEY, AUTH_JWT_SECRET, DATABASE_URL, ENABLE_IMAGE_TRANSFORMATION, FILE_SIZE_LIMIT, FILE_STORAGE_BACKEND_PATH, GLOBAL_S3_BUCKET, POSTGREST_URL (+5 more)

### Community 187 - "Community 187"
Cohesion: 0.15
Nodes (13): PGRST_DB_ANON_ROLE, PGRST_DB_EXTRA_SEARCH_PATH, PGRST_DB_MAX_ROWS, PGRST_DB_SCHEMAS, PGRST_DB_URI, PGRST_DB_USE_LEGACY_GUCS, PGRST_JWT_SECRET, depends_on (+5 more)

### Community 188 - "Community 188"
Cohesion: 0.15
Nodes (12): patterns, prefix, actions, interval, updates, commit-message, directory, groups (+4 more)

### Community 189 - "Community 189"
Cohesion: 0.15
Nodes (5): CryptoKey, CryptoKeyPair, KeyUsage, SubtleCrypto, TextEncoder

### Community 190 - "Community 190"
Cohesion: 0.27
Nodes (11): app.event_locations_before_insert(), app.license_has_feature(), event_locations_before_insert, event_locations_location_idx, events_before_write, events_floor_idx, events_touch_updated_at, events_venue_live_idx (+3 more)

### Community 191 - "Community 191"
Cohesion: 0.23
Nodes (10): A4, analyticsPdf(), fixed(), Line, lines(), pages(), ANALYTICS_KIND_LABELS, ANALYTICS_KINDS (+2 more)

### Community 192 - "Community 192"
Cohesion: 0.36
Nodes (4): vite-plugin-pwa@catalog:, vite-plugin-pwa, thirdPartyNotices(), UI_FONT_NOTICES

### Community 193 - "Community 193"
Cohesion: 0.24
Nodes (9): RFC-9562, createImdfWriter(), IMDF_FEATURE_TYPES, ImdfFeature, ImdfFeatureType, ImdfGeometry, hex(), isUuid() (+1 more)

### Community 194 - "Community 194"
Cohesion: 0.23
Nodes (12): steps, steps, BASE, CHANGES, E2E, steps, env, id (+4 more)

### Community 195 - "Community 195"
Cohesion: 0.17
Nodes (12): if, name, needs, runs-on, strategy, timeout-minutes, args, name (+4 more)

### Community 196 - "Community 196"
Cohesion: 0.17
Nodes (4): VendorClientsRepository, VendorTrialRequest, VendorClient, VendorInstallation

### Community 197 - "Community 197"
Cohesion: 0.21
Nodes (10): EntranceFeature, BASE, corridor, EMPTY, FEATURES, m(), near(), point() (+2 more)

### Community 198 - "Community 198"
Cohesion: 0.20
Nodes (10): FACILITY_TYPE_NAME_MAX, FacilityIconFileCheck, FacilityIconFileProblem, FacilityIconFormat, FacilityTypeNameProblem, ICON_EXTENSION, ICON_MIME, NameProblem (+2 more)

### Community 199 - "Community 199"
Cohesion: 0.29
Nodes (7): PictogramKey, LIBRARY_SHAPES, LUCIDE_VERSION, partAttributes(), LEGACY_SHAPES, PICTOGRAM_SHAPES, PictogramPart

### Community 200 - "Community 200"
Cohesion: 0.18
Nodes (7): anonHeaders, gzip, options, QUERIES, TABLE_USERS, tablePage(), tables()

### Community 201 - "Community 201"
Cohesion: 0.18
Nodes (6): LABEL_FONT, LATIN, LATIN_EXT, LABEL_FONT, LATIN, LATIN_EXT

### Community 202 - "Community 202"
Cohesion: 0.18
Nodes (11): depends_on, condition, db, rest, depends_on, condition, storage, depends_on (+3 more)

### Community 203 - "Community 203"
Cohesion: 0.20
Nodes (11): environment, ALLOWED_ORIGINS, APP_VERSION, JWT_SECRET, LICENSE_VENDOR_URL, SEND_EMAIL_HOOK_SECRET, SUPABASE_ANON_KEY, SUPABASE_DB_URL (+3 more)

### Community 204 - "Community 204"
Cohesion: 0.20
Nodes (9): name, services, volumes, caddy-config, caddy-data, db-data, storage-data, x-logging (+1 more)

### Community 205 - "Community 205"
Cohesion: 0.20
Nodes (10): command, environment, image, logging, restart, volumes, PGPORT, POSTGRES_DB (+2 more)

### Community 206 - "Community 206"
Cohesion: 0.20
Nodes (10): outputs, runs-on, jobs, changes, result, code, if, name (+2 more)

### Community 207 - "Community 207"
Cohesion: 0.36
Nodes (9): ANALYTICS_BATCH_MAX, sanitizeAnalyticsEvents(), allow, clientAddress(), config(), corsHeaders, ingest(), json() (+1 more)

### Community 208 - "Community 208"
Cohesion: 0.38
Nodes (8): make_handler(), _allowed_origin(), _cors(), do_GET(), do_OPTIONS(), do_POST(), _fail(), _json()

### Community 209 - "Community 209"
Cohesion: 0.38
Nodes (9): app.backup_runs, app.health_alerts, app.health_backup_result(), app.health_conditions(), app.health_evaluate(), app.health_report(), app.server_health, backup_runs_finished_idx (+1 more)

### Community 210 - "Community 210"
Cohesion: 0.33
Nodes (5): ReceivedWebhook, signatureValid(), startWebhookReceiver(), shot(), visitorLabel()

### Community 211 - "Community 211"
Cohesion: 0.22
Nodes (9): with, cache, fetch-depth, if-no-files-found, key, name, node-version-file, path (+1 more)

### Community 212 - "Community 212"
Cohesion: 0.36
Nodes (3): license_of(), license_text(), main()

### Community 213 - "Community 213"
Cohesion: 0.29
Nodes (6): ALL, capture(), MENUS, shot(), SUPER_ADMIN_ONLY, WITHOUT_ADMIN_ONLY

### Community 214 - "Community 214"
Cohesion: 0.39
Nodes (7): base64(), Claimed, deliver(), dispatch(), encoder, rpc(), sign()

### Community 216 - "Community 216"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 217 - "Community 217"
Cohesion: 0.29
Nodes (5): compilerOptions, types, extends, include, $schema

### Community 218 - "Community 218"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 219 - "Community 219"
Cohesion: 0.38
Nodes (6): LicenseKeysPanel(), NewKey(), failed(), keys, useLicenseKeyActions(), useLicenseKeys()

### Community 220 - "Community 220"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 221 - "Community 221"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 223 - "Community 223"
Cohesion: 0.57
Nodes (7): healthcheck, healthcheck, interval, retries, test, timeout, healthcheck

### Community 224 - "Community 224"
Cohesion: 0.29
Nodes (7): aliases, image, logging, networks, restart, default, functions

### Community 225 - "Community 225"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 226 - "Community 226"
Cohesion: 0.29
Nodes (6): concurrency, cancel-in-progress, group, name, permissions, contents

### Community 227 - "Community 227"
Cohesion: 0.29
Nodes (6): compilerOptions, jsx, lib, types, extends, include

### Community 228 - "Community 228"
Cohesion: 0.29
Nodes (6): compilerOptions, lib, types, exclude, extends, include

### Community 229 - "Community 229"
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
Nodes (4): c, h, k, r

### Community 236 - "Community 236"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 237 - "Community 237"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 238 - "Community 238"
Cohesion: 0.33
Nodes (5): compilerOptions, lib, types, extends, include

### Community 239 - "Community 239"
Cohesion: 0.60
Nodes (4): BrandingPreview(), CHIPS, Mark(), RouteSketch()

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

## Knowledge Gaps
- **9 isolated node(s):** `RFC-6238`, `RFC-7946`, `RFC-2045`, `RFC-2387`, `RFC-4180` (+4 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2884 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-i18next` connect `Community 26` to `Community 1`, `Community 68`, `Community 7`, `Community 9`, `Community 107`, `Community 75`, `Community 16`, `Community 17`, `Community 85`, `Community 63`, `Community 31`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `RFC-6238`, `RFC-7946`, `RFC-2045` to the rest of the system?**
  _9 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.025274201239866477 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Community 7` to `Community 0`, `Community 1`, `Community 4`, `Community 6`, `Community 8`, `Community 9`, `Community 138`, `Community 16`, `Community 145`, `Community 147`, `Community 26`, `Community 28`, `Community 157`, `Community 31`, `Community 33`, `Community 162`, `Community 41`, `Community 175`, `Community 48`, `Community 49`, `Community 50`, `Community 54`, `Community 184`, `Community 61`, `Community 63`, `Community 67`, `Community 68`, `Community 73`, `Community 74`, `Community 80`, `Community 83`, `Community 86`, `Community 89`, `Community 219`, `Community 106`, `Community 239`, `Community 118`, `Community 121`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.038182934315531 - nodes in this community are weakly interconnected._
- **Why does `VenueId` connect `Community 15` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 138`, `Community 12`, `Community 13`, `Community 14`, `Community 142`, `Community 16`, `Community 145`, `Community 147`, `Community 23`, `Community 25`, `Community 27`, `Community 31`, `Community 33`, `Community 35`, `Community 37`, `Community 47`, `Community 50`, `Community 51`, `Community 180`, `Community 61`, `Community 63`, `Community 64`, `Community 67`, `Community 68`, `Community 69`, `Community 198`, `Community 74`, `Community 84`, `Community 86`, `Community 95`, `Community 96`, `Community 97`, `Community 104`, `Community 108`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03126436781609195 - nodes in this community are weakly interconnected._