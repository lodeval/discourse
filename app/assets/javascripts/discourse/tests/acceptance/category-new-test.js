import { click, currentURL, fillIn, visit } from "@ember/test-helpers";
import { test } from "qunit";
import sinon from "sinon";
import DiscourseURL from "discourse/lib/url";
import { acceptance } from "discourse/tests/helpers/qunit-helpers";
import selectKit from "discourse/tests/helpers/select-kit-helper";
import { i18n } from "discourse-i18n";

acceptance("New category access for moderators", function (needs) {
  needs.user({ moderator: true, admin: false, trust_level: 1 });

  test("Authorizes access based on site setting", async function (assert) {
    this.siteSettings.moderators_manage_categories_and_groups = false;
    await visit("/new-category");

    assert.strictEqual(currentURL(), "/404");

    this.siteSettings.moderators_manage_categories_and_groups = true;
    await visit("/new-category");

    assert.strictEqual(
      currentURL(),
      "/new-category",
      "it allows access to new category when site setting is enabled"
    );
  });
});

acceptance("New category access for non authorized users", function () {
  test("Prevents access when not signed in", async function (assert) {
    await visit("/new-category");
    assert.strictEqual(currentURL(), "/404");
  });
});

acceptance("Category New", function (needs) {
  needs.user();

  test("Creating a new category", async function (assert) {
    await visit("/new-category");

    assert.dom(".badge-category").exists();
    assert.dom(".category-breadcrumb").doesNotExist();

    await fillIn("input.category-name", "testing");
    assert.dom(".badge-category").hasText("testing");

    await click(".edit-category-nav .edit-category-topic-template a");
    assert
      .dom(".edit-category-tab-topic-template.active")
      .exists("it can switch to the topic template tab");

    await click(".edit-category-nav .edit-category-tags a");
    await click("button.add-required-tag-group");

    const tagSelector = selectKit(
      ".required-tag-group-row .select-kit.tag-group-chooser"
    );
    await tagSelector.expand();
    await tagSelector.selectRowByValue("TagGroup1");

    await click("#save-category");

    assert.strictEqual(
      currentURL(),
      "/c/testing/edit/general",
      "it transitions to the category edit route"
    );

    await click(".edit-category-nav .edit-category-tags a");

    assert
      .dom(".required-tag-group-row .select-kit-header[data-value='TagGroup1']")
      .exists("shows saved required tag group");

    assert.dom(".edit-category-title h2").hasText(
      i18n("category.edit_dialog_title", {
        categoryName: "testing",
      })
    );

    await click(".edit-category-security a");
    assert
      .dom(".permission-row button.reply-toggle")
      .exists("it can switch to the security tab");

    await click(".edit-category-settings a");
    assert
      .dom("#category-search-priority")
      .exists("it can switch to the settings tab");

    sinon.stub(DiscourseURL, "routeTo");

    await click(".category-back");
    assert.true(
      DiscourseURL.routeTo.calledWith("/c/testing/11"),
      "back routing works"
    );
  });
});

acceptance("New category preview", function (needs) {
  needs.user({ admin: true });

  test("Category badge color appears and updates", async function (assert) {
    await visit("/new-category");

    let previewBadgeColor = document
      .querySelector(".category-style .badge-category")
      .style.getPropertyValue("--category-badge-color")
      .trim();

    assert.strictEqual(previewBadgeColor, "#0088CC");

    await fillIn(".hex-input", "FF00FF");

    previewBadgeColor = document
      .querySelector(".category-style .badge-category")
      .style.getPropertyValue("--category-badge-color")
      .trim();

    assert.strictEqual(previewBadgeColor, "#FF00FF");
  });
});
