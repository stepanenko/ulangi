/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import * as _ from 'lodash';
import { action } from 'mobx';

import { ObservableEventStore } from './ObservableEventStore';
import { ObservableNetworkStore } from './ObservableNetworkStore';
import { ObservableNotificationStore } from './ObservableNotificationStore';
import { ObservableRemoteConfigStore } from './ObservableRemoteConfigStore';
import { ObservableSetStore } from './ObservableSetStore';
import { ObservableStore } from './ObservableStore';
import { ObservableSyncStore } from './ObservableSyncStore';
import { ObservableThemeStore } from './ObservableThemeStore';
import { ObservableUserStore } from './ObservableUserStore';

export class ObservableRootStore extends ObservableStore {
  public readonly userStore: ObservableUserStore;
  public readonly setStore: ObservableSetStore;
  public readonly networkStore: ObservableNetworkStore;
  public readonly syncStore: ObservableSyncStore;
  public readonly remoteConfigStore: ObservableRemoteConfigStore;
  public readonly notificationStore: ObservableNotificationStore;
  public readonly themeStore: ObservableThemeStore;
  public readonly eventStore: ObservableEventStore;

  @action
  public reset(newRootStore: ObservableRootStore): void {
    _.forOwn(
      this,
      (_, childStoreName): void => {
        const newChildStore =
          newRootStore[childStoreName as keyof ObservableRootStore];
        if (newChildStore instanceof ObservableStore) {
          (this[
            childStoreName as keyof ObservableRootStore
          ] as ObservableStore).reset(newChildStore);
        }
      }
    );
  }

  public constructor(
    userStore: ObservableUserStore,
    setStore: ObservableSetStore,
    networkStore: ObservableNetworkStore,
    syncStore: ObservableSyncStore,
    remoteConfigStore: ObservableRemoteConfigStore,
    notificationStore: ObservableNotificationStore,
    themeStore: ObservableThemeStore,
    eventStore: ObservableEventStore
  ) {
    super();
    this.userStore = userStore;
    this.setStore = setStore;
    this.networkStore = networkStore;
    this.syncStore = syncStore;
    this.remoteConfigStore = remoteConfigStore;
    this.notificationStore = notificationStore;
    this.themeStore = themeStore;
    this.eventStore = eventStore;
  }
}
