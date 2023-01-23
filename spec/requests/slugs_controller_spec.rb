# frozen_string_literal: true

RSpec.describe SlugsController do
  fab!(:current_user) { Fabricate(:user, trust_level: TrustLevel[4]) }

  describe "#generate" do
    let(:name) { "Arts & Media" }

    context "when user not logged in" do
      it "returns a 403 error" do
        get "/slugs/generate.json?name=#{name}"
        expect(response.status).to eq(403)
      end
    end

    context "when user is logged in" do
      before { sign_in(current_user) }

      it "generates a slug from the name" do
        get "/slugs/generate.json", params: { name: name }
        expect(response.status).to eq(200)
        expect(response.parsed_body["slug"]).to eq(Slug.for(name, ""))
      end

      it "rate limits" do
        RateLimiter.enable

        stub_const(SlugsController, "MAX_SLUG_GENERATIONS_PER_MINUTE", 1) do
          get "/slugs/generate.json?name=#{name}"
          get "/slugs/generate.json?name=#{name}"
        end

        expect(response.status).to eq(429)
      end

      it "requires name" do
        get "/slugs/generate.json"
        expect(response.status).to eq(400)
      end

      context "when user is not TL4 or higher" do
        before { current_user.change_trust_level!(1) }

        it "returns a 403 error" do
          get "/slugs/generate.json?name=#{name}"
          expect(response.status).to eq(403)
        end
      end

      context "when user is admin" do
        fab!(:current_user) { Fabricate(:admin) }

        it "generates a slug from the name" do
          get "/slugs/generate.json", params: { name: name }
          expect(response.status).to eq(200)
          expect(response.parsed_body["slug"]).to eq(Slug.for(name, ""))
        end
      end
    end
  end
end
